-- ============================================================================
-- INVOICE APPLICATION STORED PROCEDURES
-- ARCHITECTURE: EXACT FINNECT / MY HR COMPLIANT
-- ============================================================================

USE [InvoiceAppDb];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 1. AUTHENTICATION & LOGIN PROCEDURES
-- ────────────────────────────────────────────────────────────────────────────

-- [dbo].[getUserLoginDetails]
CREATE OR ALTER PROCEDURE [dbo].[getUserLoginDetails]
(
    @UserName NVARCHAR(100)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [LoginID],
        [UserName],
        [FullName],
        [DisplayName],
        [Email],
        [PasswordHash],
        [RoleName],
        [IsLockedOut],
        [IsLockedPermanently],
        [FailedLoginAttemptCount],
        [LoginMessage],
        [LastLoginDate],
        [IsActive]
    FROM [dbo].[Users]
    WHERE [UserName] = @UserName OR [Email] = @UserName;
END;
GO

-- [dbo].[RegisterFailedLoginAttempt]
CREATE OR ALTER PROCEDURE [dbo].[RegisterFailedLoginAttempt]
(
    @UserName          NVARCHAR(100),
    @MaxFailedAttempts INT         = 5,
    @IPAddress         VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentCount INT = 0;
    DECLARE @LoginID NVARCHAR(50);

    SELECT
        @LoginID = [LoginID],
        @CurrentCount = ISNULL([FailedLoginAttemptCount], 0)
    FROM [dbo].[Users]
    WHERE [UserName] = @UserName;

    IF @LoginID IS NOT NULL
        BEGIN
            SET @CurrentCount = @CurrentCount + 1;

            IF @CurrentCount >= @MaxFailedAttempts
                BEGIN
                    UPDATE [dbo].[Users]
                    SET [FailedLoginAttemptCount] = @CurrentCount,
                        [LastFailedLoginDate]     = GETDATE(),
                        [IsLockedOut]             = 1,
                        [LoginMessage]            = 'Account locked due to 5 consecutive failed login attempts.'
                    WHERE [LoginID] = @LoginID;

                    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
                    VALUES (GETDATE(), @UserName, 'LOCK_USER_AUTO', 'AUTH', 'Exceeded maximum failed login attempts (5)', @IPAddress);
                END
            ELSE
                BEGIN
                    UPDATE [dbo].[Users]
                    SET [FailedLoginAttemptCount] = @CurrentCount,
                        [LastFailedLoginDate]     = GETDATE()
                    WHERE [LoginID] = @LoginID;

                    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
                    VALUES (GETDATE(), @UserName, 'LOGIN_FAILED', 'AUTH', 'Failed attempt #' + CAST(@CurrentCount AS VARCHAR(5)), @IPAddress);
                END
        END
END;
GO

-- [dbo].[RegisterSuccessfulLogin]
CREATE OR ALTER PROCEDURE [dbo].[RegisterSuccessfulLogin]
(
    @UserName  NVARCHAR(100),
    @IPAddress VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleName NVARCHAR(100);

    SELECT @RoleName = [RoleName] FROM [dbo].[Users] WHERE [UserName] = @UserName;

    UPDATE [dbo].[Users]
    SET [FailedLoginAttemptCount] = 0,
        [LastLoginDate]           = GETDATE(),
        [LoginMessage]            = NULL
    WHERE [UserName] = @UserName;

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (GETDATE(), @UserName, 'LOGIN_SUCCESS', 'AUTH', 'Logged in successfully. Role: ' + ISNULL(@RoleName, 'User'), @IPAddress);
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ACCESS LIST & ROLE-WISE MENU ACCESS TABLES SETUP
-- ────────────────────────────────────────────────────────────────────────────

IF OBJECT_ID(N'[dbo].[AccessList]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AccessList] (
        [AccessID]       INT                 PRIMARY KEY,
        [ModuleID]       INT                 NOT NULL,
        [ModuleName]     NVARCHAR(100)       NOT NULL,
        [FunctionName]   NVARCHAR(200)       NOT NULL,
        [NavigationURL]  NVARCHAR(500)       NULL,
        [MenuID]         INT                 NULL,
        [DisplayOrder]   INT                 NOT NULL DEFAULT 1,
        [IsActive]       BIT                 NOT NULL DEFAULT 1
    );
END
GO

IF OBJECT_ID(N'[dbo].[RoleWiseMenuAccess]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[RoleWiseMenuAccess] (
        [RoleID]        INT                 NOT NULL,
        [AccessID]      INT                 NOT NULL,
        [IsActive]      INT                 NOT NULL DEFAULT 1,
        [AddedBy]       NVARCHAR(100)       NULL,
        [AddedDate]     DATETIME            NOT NULL DEFAULT GETDATE(),
        [UpdatedBy]     NVARCHAR(100)       NULL,
        [UpdatedDate]   DATETIME            NULL,
        CONSTRAINT PK_RoleWiseMenuAccess PRIMARY KEY ([RoleID], [AccessID])
    );
END
GO

-- Seed & Synchronize System Access Functions
MERGE [dbo].[AccessList] AS target
USING (VALUES
    (1001, 1, 'Overview',       'Dashboard',         '/main/dashboard',         1, 1, 1),
    (1002, 2, 'Administration', 'Users',             '/main/users',             1, 2, 1),
    (1004, 2, 'Administration', 'Role Permissions',  '/main/admin/role-access', 1, 3, 1),
    (1008, 2, 'Administration', 'User Roles',        '/main/admin/roles',       1, 4, 1),
    (1005, 2, 'Administration', 'Assign Roles',      '/main/admin/assign-roles',1, 5, 1),
    (2001, 3, 'Security',       'Audit Trail',       '/main/audit',             2, 1, 1),
    (3001, 4, 'System',         'Settings',          '/main/settings',          3, 1, 1),
    (8001, 5, 'Billing',        'Invoices',          '/main/invoices',          4, 1, 1)
) AS source ([AccessID], [ModuleID], [ModuleName], [FunctionName], [NavigationURL], [MenuID], [DisplayOrder], [IsActive])
ON target.[AccessID] = source.[AccessID]
WHEN MATCHED THEN
    UPDATE SET 
        target.[ModuleID]      = source.[ModuleID],
        target.[ModuleName]    = source.[ModuleName],
        target.[FunctionName]  = source.[FunctionName],
        target.[NavigationURL] = source.[NavigationURL],
        target.[MenuID]        = source.[MenuID],
        target.[DisplayOrder]  = source.[DisplayOrder],
        target.[IsActive]      = source.[IsActive]
WHEN NOT MATCHED THEN
    INSERT ([AccessID], [ModuleID], [ModuleName], [FunctionName], [NavigationURL], [MenuID], [DisplayOrder], [IsActive])
    VALUES (source.[AccessID], source.[ModuleID], source.[ModuleName], source.[FunctionName], source.[NavigationURL], source.[MenuID], source.[DisplayOrder], source.[IsActive]);
GO

-- Seed Role 1 (System Administrator): Full Access
INSERT INTO [dbo].[RoleWiseMenuAccess] ([RoleID], [AccessID], [IsActive], [AddedBy], [AddedDate])
SELECT 1, al.[AccessID], 1, 'System', GETDATE()
FROM [dbo].[AccessList] al
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[RoleWiseMenuAccess] rma WHERE rma.[RoleID] = 1 AND rma.[AccessID] = al.[AccessID]
);
GO

-- Seed Role 2 (Finance Manager): Invoices + Audit + Dashboard
INSERT INTO [dbo].[RoleWiseMenuAccess] ([RoleID], [AccessID], [IsActive], [AddedBy], [AddedDate])
SELECT 2, a.[AccessID], 1, 'System', GETDATE()
FROM (VALUES (1001), (8001), (2001)) AS a([AccessID])
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[RoleWiseMenuAccess] rma WHERE rma.[RoleID] = 2 AND rma.[AccessID] = a.[AccessID]
);
GO

-- Seed Role 3 (Billing Officer): Invoices + Dashboard
INSERT INTO [dbo].[RoleWiseMenuAccess] ([RoleID], [AccessID], [IsActive], [AddedBy], [AddedDate])
SELECT 3, a.[AccessID], 1, 'System', GETDATE()
FROM (VALUES (1001), (8001)) AS a([AccessID])
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[RoleWiseMenuAccess] rma WHERE rma.[RoleID] = 3 AND rma.[AccessID] = a.[AccessID]
);
GO

-- Seed Role 4 (User): Dashboard
INSERT INTO [dbo].[RoleWiseMenuAccess] ([RoleID], [AccessID], [IsActive], [AddedBy], [AddedDate])
SELECT 4, a.[AccessID], 1, 'System', GETDATE()
FROM (VALUES (1001)) AS a([AccessID])
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[RoleWiseMenuAccess] rma WHERE rma.[RoleID] = 4 AND rma.[AccessID] = a.[AccessID]
);
GO

-- [dbo].[GetMenuID]
CREATE OR ALTER PROCEDURE [dbo].[GetMenuID]
(
    @LoginID    NVARCHAR(100) = NULL,
    @MenuID     INT = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleName NVARCHAR(100);
    DECLARE @RoleId INT;

    IF @LoginID IS NOT NULL AND @LoginID <> ''
    BEGIN
        SELECT TOP 1 @RoleName = [RoleName] FROM [dbo].[Users] WHERE [UserName] = @LoginID OR [LoginID] = @LoginID;
    END

    IF @RoleName IS NOT NULL
    BEGIN
        SELECT TOP 1 @RoleId = [RoleId] FROM [dbo].[UserRoles] WHERE [RoleName] = @RoleName;
    END

    -- If Admin or no role specified or RoleId 1, return all active access items
    IF @RoleId = 1 OR @RoleName = 'System Administrator' OR @RoleId IS NULL
    BEGIN
        SELECT 
            al.[AccessID]      AS [FunctionID],
            al.[FunctionName]  AS [FunctionName],
            al.[NavigationURL] AS [NavigationURL],
            al.[DisplayOrder]  AS [DisplayOrder],
            al.[ModuleName]    AS [Module]
        FROM [dbo].[AccessList] al
        WHERE al.[IsActive] = 1
        ORDER BY al.[ModuleID], al.[DisplayOrder];
    END
    ELSE
    BEGIN
        SELECT 
            al.[AccessID]      AS [FunctionID],
            al.[FunctionName]  AS [FunctionName],
            al.[NavigationURL] AS [NavigationURL],
            al.[DisplayOrder]  AS [DisplayOrder],
            al.[ModuleName]    AS [Module]
        FROM [dbo].[AccessList] al
        INNER JOIN [dbo].[RoleWiseMenuAccess] rma ON rma.[AccessID] = al.[AccessID] AND rma.[RoleID] = @RoleId
        WHERE al.[IsActive] = 1 AND rma.[IsActive] = 1
        ORDER BY al.[ModuleID], al.[DisplayOrder];
    END
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 2. USER ADMINISTRATION PROCEDURES
-- ────────────────────────────────────────────────────────────────────────────

-- [dbo].[Get_All_Users]
CREATE OR ALTER PROCEDURE [dbo].[Get_All_Users]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [LoginID],
        [UserName],
        [FullName],
        [DisplayName],
        [Email],
        [ContactNumber],
        [NIC],
        [RoleName],
        [IsLockedOut],
        [IsLockedPermanently],
        [IsActive],
        [CreatedAt],
        [LastLoginDate]
    FROM [dbo].[Users]
    ORDER BY [CreatedAt] DESC;
END;
GO

-- [dbo].[InsertOrUpdate_User]
CREATE OR ALTER PROCEDURE [dbo].[InsertOrUpdate_User]
(
    @Action        CHAR(1),           -- 'I' = Insert, 'U' = Update
    @LoginID       NVARCHAR(50) = NULL,
    @UserName      NVARCHAR(100),
    @FullName      NVARCHAR(200),
    @DisplayName   NVARCHAR(150) = NULL,
    @NIC           VARCHAR(20) = NULL,
    @ContactNumber NVARCHAR(20) = NULL,
    @Email         NVARCHAR(200) = NULL,
    @PasswordHash  NVARCHAR(500) = NULL,
    @RoleName      NVARCHAR(100) = 'User',
    @IsActive      BIT = 1,
    @Operator      NVARCHAR(100) = 'System',
    @IPAddress     VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @Action = 'I'
        BEGIN
            IF EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [UserName] = @UserName)
                BEGIN
                    RAISERROR('Username already exists.', 16, 1);
                    RETURN;
                END

            SET @LoginID = ISNULL(@LoginID, UPPER(NEWID()));

            INSERT INTO [dbo].[Users]
            (
                [LoginID], [UserName], [FullName], [DisplayName], [NIC], [ContactNumber],
                [Email], [PasswordHash], [RoleName], [IsActive], [IsLockedOut], [IsLockedPermanently],
                [FailedLoginAttemptCount], [CreatedAt]
            )
            VALUES
                (
                    @LoginID, @UserName, @FullName, ISNULL(@DisplayName, @FullName), @NIC, @ContactNumber,
                    @Email, @PasswordHash, ISNULL(@RoleName, 'User'), @IsActive, 0, 0,
                    0, GETDATE()
                );

            INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
            VALUES (GETDATE(), @Operator, 'CREATE_USER', 'ADMIN_USERS', 'Created user: ' + @UserName + ' (' + @RoleName + ')', @IPAddress);

            SELECT @LoginID AS [LoginID], 'User created successfully' AS [Message];
        END
    ELSE IF @Action = 'U'
        BEGIN
            UPDATE [dbo].[Users]
            SET [FullName]      = @FullName,
                [DisplayName]   = ISNULL(@DisplayName, @FullName),
                [NIC]           = @NIC,
                [ContactNumber] = @ContactNumber,
                [Email]         = @Email,
                [RoleName]      = ISNULL(@RoleName, [RoleName]),
                [IsActive]      = ISNULL(@IsActive, [IsActive]),
                [PasswordHash]  = ISNULL(@PasswordHash, [PasswordHash]),
                [UpdatedAt]     = GETDATE()
            WHERE [LoginID] = @LoginID OR [UserName] = @UserName;

            INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
            VALUES (GETDATE(), @Operator, 'UPDATE_USER', 'ADMIN_USERS', 'Updated profile for: ' + @UserName, @IPAddress);

            SELECT @LoginID AS [LoginID], 'User updated successfully' AS [Message];
        END
END;
GO

-- [dbo].[ToggleLockUser]
CREATE OR ALTER PROCEDURE [dbo].[ToggleLockUser]
(
    @LoginID   NVARCHAR(50),
    @Lock      BIT,
    @Reason    NVARCHAR(500) = NULL,
    @Operator  NVARCHAR(100) = 'System',
    @IPAddress VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserName NVARCHAR(100);
    SELECT @UserName = [UserName] FROM [dbo].[Users] WHERE [LoginID] = @LoginID;

    UPDATE [dbo].[Users]
    SET [IsLockedOut]             = @Lock,
        [LoginMessage]            = CASE WHEN @Lock = 1 THEN ISNULL(@Reason, 'Account locked by Administrator.') ELSE NULL END,
        [FailedLoginAttemptCount] = CASE WHEN @Lock = 0 THEN 0 ELSE [FailedLoginAttemptCount] END
    WHERE [LoginID] = @LoginID;

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
               GETDATE(),
               @Operator,
               CASE WHEN @Lock = 1 THEN 'LOCK_USER' ELSE 'UNLOCK_USER' END,
               'ADMIN_USERS',
               'User ' + ISNULL(@UserName, @LoginID) + (CASE WHEN @Lock = 1 THEN ' locked. Reason: ' ELSE ' unlocked.' END) + ISNULL(@Reason, ''),
               @IPAddress
           );
END;
GO

-- [dbo].[Get_All_Roles]
CREATE OR ALTER PROCEDURE [dbo].[Get_All_Roles]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [RoleId], [RoleName], [Description], [IsActive], [CreatedAt]
    FROM [dbo].[UserRoles]
    WHERE [IsActive] = 1
    ORDER BY [RoleId];
END;
GO

-- [dbo].[Assign_User_Role]
CREATE OR ALTER PROCEDURE [dbo].[Assign_User_Role]
(
    @LoginID   NVARCHAR(50),
    @RoleName  NVARCHAR(100),
    @Operator  NVARCHAR(100) = 'System',
    @IPAddress VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OldRole NVARCHAR(100);
    DECLARE @UserName NVARCHAR(100);

    SELECT @OldRole = [RoleName], @UserName = [UserName]
    FROM [dbo].[Users]
    WHERE [LoginID] = @LoginID;

    UPDATE [dbo].[Users]
    SET [RoleName]  = @RoleName,
        [UpdatedAt] = GETDATE()
    WHERE [LoginID] = @LoginID;

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
               GETDATE(),
               @Operator,
               'ASSIGN_ROLE',
               'ADMIN_ROLES',
               'Role for ' + ISNULL(@UserName, @LoginID) + ' changed from ''' + ISNULL(@OldRole, 'None') + ''' to ''' + @RoleName + '''',
               @IPAddress
           );
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 3. AUDIT TRAIL PROCEDURES
-- ────────────────────────────────────────────────────────────────────────────

-- [dbo].[Get_Audit_Logs]
CREATE OR ALTER PROCEDURE [dbo].[Get_Audit_Logs]
(
    @Module NVARCHAR(100) = NULL,
    @Search NVARCHAR(200) = NULL,
    @Limit  INT           = 200
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Limit)
        [Id],
        [Timestamp],
        [UserName],
        [Action],
        [Module],
        [Details],
        [IpAddress]
    FROM [dbo].[AuditTrails]
    WHERE (@Module IS NULL OR @Module = 'ALL' OR [Module] = @Module)
      AND (@Search IS NULL OR @Search = '' OR [UserName] LIKE '%' + @Search + '%' OR [Action] LIKE '%' + @Search + '%' OR [Details] LIKE '%' + @Search + '%')
    ORDER BY [Timestamp] DESC;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 4. SYSTEM SETTINGS PROCEDURES
-- ────────────────────────────────────────────────────────────────────────────

-- [dbo].[Get_System_Settings]
CREATE OR ALTER PROCEDURE [dbo].[Get_System_Settings]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [Id], [Category], [SettingKey], [SettingValue], [Description], [UpdatedAt], [UpdatedBy]
    FROM [dbo].[SystemSettings]
    ORDER BY [Category], [SettingKey];
END;
GO

-- [dbo].[Update_System_Setting]
CREATE OR ALTER PROCEDURE [dbo].[Update_System_Setting]
(
    @Id           INT,
    @SettingValue NVARCHAR(500),
    @Operator     NVARCHAR(100) = 'System',
    @IPAddress    VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OldValue NVARCHAR(500);
    DECLARE @Key NVARCHAR(100);
    DECLARE @Category NVARCHAR(100);

    SELECT
        @OldValue = [SettingValue],
        @Key = [SettingKey],
        @Category = [Category]
    FROM [dbo].[SystemSettings]
    WHERE [Id] = @Id;

    UPDATE [dbo].[SystemSettings]
    SET [SettingValue] = @SettingValue,
        [UpdatedAt]    = GETDATE(),
        [UpdatedBy]    = @Operator
    WHERE [Id] = @Id;

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
               GETDATE(),
               @Operator,
               'UPDATE_SETTING',
               'SETTINGS',
               @Category + '.' + @Key + ': ''' + ISNULL(@OldValue, '') + ''' -> ''' + @SettingValue + '''',
               @IPAddress
           );
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 5. INVOICE PROCEDURES
-- ────────────────────────────────────────────────────────────────────────────

-- [dbo].[Get_All_Invoices]
CREATE OR ALTER PROCEDURE [dbo].[Get_All_Invoices]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        i.[Id],
        i.[InvoiceNumber],
        i.[CustomerName],
        i.[CustomerEmail],
        i.[IssueDate],
        i.[DueDate],
        i.[Status],
        i.[TotalAmount],
        i.[Notes],
        i.[CreatedAt]
    FROM [dbo].[Invoices] i
    ORDER BY i.[CreatedAt] DESC;

    -- Return Line Items in second result set
    SELECT
        it.[Id],
        it.[InvoiceId],
        it.[Description],
        it.[Quantity],
        it.[UnitPrice],
        it.[Amount]
    FROM [dbo].[InvoiceItems] it;
END;
GO

-- [dbo].[Get_Invoice_By_Id]
CREATE OR ALTER PROCEDURE [dbo].[Get_Invoice_By_Id]
(
    @Id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [Id],
        [InvoiceNumber],
        [CustomerName],
        [CustomerEmail],
        [IssueDate],
        [DueDate],
        [Status],
        [TotalAmount],
        [Notes],
        [CreatedAt]
    FROM [dbo].[Invoices]
    WHERE [Id] = @Id;

    SELECT
        [Id],
        [InvoiceId],
        [Description],
        [Quantity],
        [UnitPrice],
        [Amount]
    FROM [dbo].[InvoiceItems]
    WHERE [InvoiceId] = @Id;
END;
GO

-- [dbo].[Insert_Invoice]
CREATE OR ALTER PROCEDURE [dbo].[Insert_Invoice]
(
    @InvoiceNumber NVARCHAR(50),
    @CustomerName  NVARCHAR(200),
    @CustomerEmail NVARCHAR(200) = NULL,
    @IssueDate     DATETIME2,
    @DueDate       DATETIME2,
    @Status        NVARCHAR(50),
    @TotalAmount   DECIMAL(18,2),
    @Notes         NVARCHAR(MAX) = NULL,
    @Operator      NVARCHAR(100) = 'System',
    @IPAddress     VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Invoices]
    (
        [InvoiceNumber], [CustomerName], [CustomerEmail], [IssueDate],
        [DueDate], [Status], [TotalAmount], [Notes], [CreatedAt]
    )
    VALUES
        (
            @InvoiceNumber, @CustomerName, @CustomerEmail, @IssueDate,
            @DueDate, @Status, @TotalAmount, @Notes, GETDATE()
        );

    DECLARE @NewInvoiceId INT = SCOPE_IDENTITY();

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
               GETDATE(),
               @Operator,
               'CREATE_INVOICE',
               'INVOICES',
               'Created invoice ' + @InvoiceNumber + ' for ' + @CustomerName + ' ($' + CAST(@TotalAmount AS VARCHAR(20)) + ')',
               @IPAddress
           );

    SELECT @NewInvoiceId AS [InvoiceId];
END;
GO

-- [dbo].[Insert_Invoice_Item]
CREATE OR ALTER PROCEDURE [dbo].[Insert_Invoice_Item]
(
    @InvoiceId   INT,
    @Description NVARCHAR(250),
    @Quantity    INT,
    @UnitPrice   DECIMAL(18,2),
    @Amount      DECIMAL(18,2)
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[InvoiceItems]
    (
        [InvoiceId], [Description], [Quantity], [UnitPrice], [Amount]
    )
    VALUES
        (
            @InvoiceId, @Description, @Quantity, @UnitPrice, @Amount
        );
END;
GO

-- [dbo].[Delete_Invoice]
CREATE OR ALTER PROCEDURE [dbo].[Delete_Invoice]
(
    @Id        INT,
    @Operator  NVARCHAR(100) = 'System',
    @IPAddress VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @InvoiceNumber NVARCHAR(50);
    SELECT @InvoiceNumber = [InvoiceNumber] FROM [dbo].[Invoices] WHERE [Id] = @Id;

    DELETE FROM [dbo].[InvoiceItems] WHERE [InvoiceId] = @Id;
    DELETE FROM [dbo].[Invoices] WHERE [Id] = @Id;

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
               GETDATE(),
               @Operator,
               'DELETE_INVOICE',
               'INVOICES',
               'Deleted invoice ID ' + CAST(@Id AS VARCHAR(10)) + ' (' + ISNULL(@InvoiceNumber, '') + ')',
               @IPAddress
           );
END;
GO

-- [dbo].[Update_Invoice]
CREATE OR ALTER PROCEDURE [dbo].[Update_Invoice]
(
    @Id            INT,
    @InvoiceNumber NVARCHAR(50),
    @CustomerName  NVARCHAR(200),
    @CustomerEmail NVARCHAR(200) = NULL,
    @IssueDate     DATETIME2,
    @DueDate       DATETIME2,
    @Status        NVARCHAR(50),
    @TotalAmount   DECIMAL(18,2),
    @Notes         NVARCHAR(MAX) = NULL,
    @Operator      NVARCHAR(100) = 'System',
    @IPAddress     VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[Invoices]
    SET [InvoiceNumber] = @InvoiceNumber,
        [CustomerName]  = @CustomerName,
        [CustomerEmail] = @CustomerEmail,
        [IssueDate]     = @IssueDate,
        [DueDate]       = @DueDate,
        [Status]        = @Status,
        [TotalAmount]   = @TotalAmount,
        [Notes]         = @Notes
    WHERE [Id] = @Id;

    DELETE FROM [dbo].[InvoiceItems] WHERE [InvoiceId] = @Id;

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
               GETDATE(),
               @Operator,
               'UPDATE_INVOICE',
               'INVOICES',
               'Updated invoice ' + @InvoiceNumber + ' for ' + @CustomerName,
               @IPAddress
           );
END;
GO

-- [dbo].[Get_User_By_Id]
CREATE OR ALTER PROCEDURE [dbo].[Get_User_By_Id]
(
    @LoginID NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [LoginID],
        [UserName],
        [FullName],
        [DisplayName],
        [Email],
        [ContactNumber],
        [NIC],
        [RoleName],
        [IsLockedOut],
        [IsLockedPermanently],
        [IsActive],
        [CreatedAt],
        [LastLoginDate]
    FROM [dbo].[Users]
    WHERE [LoginID] = @LoginID;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ROLE-WISE MENU ACCESS PROCEDURES
-- ────────────────────────────────────────────────────────────────────────────

-- [dbo].[GetRoleWiseMenuAccess]
CREATE OR ALTER PROCEDURE [dbo].[GetRoleWiseMenuAccess]
(
    @RoleID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        @RoleID                                        AS [RoleID],
        ISNULL(r.[RoleName], '')                       AS [RoleName],
        al.[AccessID]                                  AS [AccessID],
        al.[AccessID]                                  AS [FunctionID],
        al.[AccessID]                                  AS [MenuID],
        al.[ModuleID]                                  AS [ModuleID],
        al.[ModuleName]                                AS [ModuleName],
        al.[FunctionName]                              AS [FunctionName],
        al.[FunctionName]                              AS [MenuName],
        al.[NavigationURL]                             AS [NavigationURL],
        al.[DisplayOrder]                              AS [DisplayOrder],
        CASE WHEN rma.[IsActive] = 1 THEN 1 ELSE 0 END AS [IsActive]
    FROM [dbo].[AccessList] al
    LEFT JOIN [dbo].[UserRoles] r ON r.[RoleId] = @RoleID
    LEFT JOIN [dbo].[RoleWiseMenuAccess] rma ON rma.[AccessID] = al.[AccessID] AND rma.[RoleID] = @RoleID
    WHERE al.[IsActive] = 1
    ORDER BY al.[ModuleID], al.[DisplayOrder];
END;
GO

-- [dbo].[GrantOrRevokeRoleWiseMenuAccess]
CREATE OR ALTER PROCEDURE [dbo].[GrantOrRevokeRoleWiseMenuAccess]
(
    @RoleID    INT,
    @MenuID    INT, -- AccessID
    @IsActive  INT = 1,
    @Operator  NVARCHAR(100) = 'System',
    @IPAddress VARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM [dbo].[RoleWiseMenuAccess] WHERE [RoleID] = @RoleID AND [AccessID] = @MenuID)
    BEGIN
        UPDATE [dbo].[RoleWiseMenuAccess]
        SET [IsActive]    = @IsActive,
            [UpdatedBy]   = @Operator,
            [UpdatedDate] = GETDATE()
        WHERE [RoleID] = @RoleID AND [AccessID] = @MenuID;
    END
    ELSE
    BEGIN
        INSERT INTO [dbo].[RoleWiseMenuAccess] ([RoleID], [AccessID], [IsActive], [AddedBy], [AddedDate])
        VALUES (@RoleID, @MenuID, @IsActive, @Operator, GETDATE());
    END

    INSERT INTO [dbo].[AuditTrails] ([Timestamp], [UserName], [Action], [Module], [Details], [IpAddress])
    VALUES (
        GETDATE(),
        @Operator,
        'UPDATE_ROLE_ACCESS',
        'ADMIN_ROLES',
        'Updated AccessID ' + CAST(@MenuID AS VARCHAR(10)) + ' for RoleID ' + CAST(@RoleID AS VARCHAR(10)) + ' to ' + CAST(@IsActive AS VARCHAR(5)),
        @IPAddress
    );

    SELECT @RoleID AS [RoleID], @MenuID AS [AccessID], 'Role menu access updated successfully' AS [Message];
END;
GO
