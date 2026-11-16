# Enterprise Invoice Management Application - Project Scope & Changelog

## 1. Project Overview & Scope

The **Enterprise Invoice Management Application** is a production-grade, full-stack financial enterprise system designed to automate and govern the entire invoice lifecycle, role-based authorization, multi-currency accounting, and organizational auditing.

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: ASP.NET Core 8 Web API (.NET 8.0), C#, ADO.NET with Microsoft SQL Server Stored Procedures
- **Database**: Microsoft SQL Server (MSSQL 2022) with stored procedure architecture (`InvoiceAppDb`)
- **Containerization**: Docker Compose (`mssql-container` on port 1433)

---

## 2. Core Architectural Capabilities & Scope

### A. Role-Based Access Control (RBAC) & Dynamic Permissions
- Dynamic permission management loaded from database tables (`[dbo].[Roles]`, `[dbo].[Permissions]`, `[dbo].[RolePermissions]`, `[dbo].[UserRoles]`).
- Granular permissions per route and UI action (`View`, `Create`, `Edit`, `Delete`, `Sign`, `Approve`, `Export`).
- Dynamic sidebar navigation filtering based on assigned user permissions.
- In-memory and persistent `PermissionContext` and `AuthGuard` route shielding.

### B. Dynamic Currency System
- System-wide currency symbol and code resolution driven by system settings (`[dbo].[SystemSettings]` $\rightarrow$ `DefaultCurrency`).
- Automatic symbol and prefix formatting:
  - **`LKR`** $\rightarrow$ **`Rs. 1,250.00`**
  - **`USD`** $\rightarrow$ **`$1,250.00`**
  - **`EUR`** $\rightarrow$ **`€1,250.00`**
  - **`GBP`** $\rightarrow$ **`£1,250.00`**
  - **`INR`** $\rightarrow$ **`₹1,250.00`**
  - **`AUD`** $\rightarrow$ **`A$1,250.00`**
  - **`CAD`** $\rightarrow$ **`C$1,250.00`**
- Live currency switcher in Settings with reactive context propagation across the entire UI.

### C. Finance Review & Billing Officer Digital Signature Workflow
- **Finance Manager Review**:
  - Reviews pending invoices in draft/review status.
  - Dispatches a formal **"Request Sign"** command with instructions/notes.
  - Updates invoice status to `Awaiting Signature`.
  - Generates an in-app notification targeting the **Billing Officer** role.
- **Billing Officer Execution**:
  - Receives live notification in header `NotificationBell`.
  - Opens invoice details in `InvoicePrintModal`.
  - Signs electronically with digital signature data and timestamp.
  - Calls `POST /api/invoices/{id}/sign` $\rightarrow$ status becomes `Signed & Ready`.
  - System applies an official digital certificate stamp.
  - Automatically dispatches a completion notification back to the Finance Manager.
- **Print & PDF Generation**:
  - Clean `@media print` layout stripped of headers, sidebars, and interactive buttons.
  - Formatted for direct browser print and "Save as PDF" distribution.

### D. Centralized Notification Center
- Persistent `[dbo].[Notifications]` table storing targeted notifications by `UserID` or `TargetRole`.
- Interactive `NotificationBell` header component with unread badges, priority chips, direct navigation, and mark-all-read capabilities.

### E. Security, Session & Audit Logging
- PBKDF2 / SHA256 password hashing with salt and legacy password compatibility.
- Audit trail recording user actions, IP addresses, timestamps, and target entity IDs (`[dbo].[AuditLogs]`).
- Clean logout handling and session teardown across tabs and cookies.

---

## 3. Comprehensive Changelog

### Database & Stored Procedures (`backend/SQL/StoredProcedures.sql`)

1. **`[dbo].[Notifications]` Table**:
   - Created table with columns: `NotificationID`, `UserID`, `TargetRole`, `SenderUser`, `Title`, `Message`, `NotificationType`, `ReferenceID`, `Priority`, `IsRead`, `CreatedAt`, `ReadAt`.
2. **`[dbo].[Invoices]` Table Schema Extension**:
   - Added `SignedBy NVARCHAR(100)`, `SignedAt DATETIME2`, `SignatureData NVARCHAR(MAX)`, `FinanceReviewNotes NVARCHAR(MAX)`, and `Currency NVARCHAR(10)`.
3. **Stored Procedures Created / Updated**:
   - `[dbo].[Create_Notification]`: Creates user-specific or role-wide notifications.
   - `[dbo].[Get_User_Notifications]`: Retrieves unread count and latest 50 notifications for a user/role.
   - `[dbo].[Mark_Notification_Read]`: Marks single notification as read with timestamp.
   - `[dbo].[Mark_All_Notifications_Read]`: Bulk marks all notifications read for a user.
   - `[dbo].[Request_Invoice_Signature]`: Transitions invoice to `Awaiting Signature`, logs notes, and raises notification.
   - `[dbo].[Sign_Invoice]`: Transitions invoice to `Signed & Ready`, stores signature, and notifies finance team.
   - `[dbo].[Get_All_Invoices]`: Updated to project signature, notes, and currency columns.
   - `[dbo].[Get_System_Settings]` & `[dbo].[Update_System_Setting]`: Supports enterprise configuration.

---

### Backend API (`backend/`)

1. **`NotificationsController.cs` (New)**:
   - `GET /api/Notifications`: Retrieves notifications and unread counter.
   - `POST /api/Notifications/{id}/read`: Marks notification read.
   - `POST /api/Notifications/read-all`: Marks all user notifications read.
   - `POST /api/Notifications/send`: Sends custom notification.
2. **`InvoicesController.cs`**:
   - Added `POST /api/invoices/{id}/request-signature` endpoint.
   - Added `POST /api/invoices/{id}/sign` endpoint.
   - Updated `GetInvoices()` to return signature metadata and notes.
3. **`AuthController.cs`**:
   - Resolved `SqlParameterCollection` reuse bug.
   - Fixed session handling, password check logic, and secure user context extraction.
4. **`DBAccess.cs`**:
   - Added `GetDataSetAsync(...)` for multi-result stored procedure execution.
5. **`Program.cs`**:
   - Added CORS origins, registered controllers, and configured port `5038`.

---

### Frontend (`frontend/src/`)

1. **Currency Management**:
   - `frontend/src/utils/currency.ts` (New): Symbol map, prefix resolver, and `formatCurrency`.
   - `frontend/src/Contexts/CurrencyContext.tsx` (New): Global currency state provider and `useCurrency()` hook.
   - `frontend/src/app/main/settings/page.tsx`: Added interactive currency dropdown for `DefaultCurrency`.
   - `frontend/src/components/DarkPageHeader.tsx`: Integrated live currency badge pill.
   - `frontend/src/app/main/dashboard/page.tsx`: Converted all metric values to use `formatAmount()`.
2. **Notification System**:
   - `frontend/src/utils/notifications.ts` (New): Notification service functions.
   - `frontend/src/components/NotificationBell.tsx` (New): Header bell dropdown with real-time polling and badge counter.
3. **Signature & Printing Modals**:
   - `frontend/src/components/invoices/RequestSignatureModal.tsx` (New): Finance Manager modal to dispatch review notes to the Billing Officer.
   - `frontend/src/components/invoices/InvoicePrintModal.tsx` (New): Printable invoice layout, electronic signature input, digital seal rendering, and PDF trigger.
4. **Invoice Management View (`frontend/src/app/main/invoices/page.tsx`)**:
   - Integrated dynamic currency formatting.
   - Added action buttons: "Request Sign", "Sign & Print", and "View Document".
   - Added status tags for `Awaiting Signature` and `Signed & Ready`.
5. **Role-Based Access Control & Navigation**:
   - Fixed permission revoking/granting in `frontend/src/Contexts/PermissionContext.tsx`.
   - Fixed session logout and cleanup in `frontend/src/components/Sidebar.tsx` and `frontend/src/utils/auth.ts`.
   - Fixed login submission and redirection in `frontend/src/app/login/LoginComponent.tsx`.

---

## 4. User Roles & Workflow Matrix

| Role | Key Capabilities | Invoice Workflow Action |
| :--- | :--- | :--- |
| **Admin** | Full system governance, role permissions, settings, audits | Can execute all actions across all stages |
| **Finance Manager** (`sarah`) | Invoicing dashboard, financial reviews, audit logs | Reviews invoices, issues **"Request Sign"** to Billing Officer |
| **Billing Officer** (`Thusitha`) | Invoice operations, client billing, signature & PDF export | Receives notification, enters **Electronic Signature**, prints/saves **PDF** |
| **Auditor** | Read-only compliance, system audit inspection | Monitors invoice audit trail and signature integrity |

---

## 5. Verification & Testing Summary

- **Frontend Compilation**: Built with `npm run build --prefix frontend`. All 14 routes statically prerendered with 0 errors and 0 warnings.
- **Backend Testing**: API endpoints tested against running MSSQL container on port 1433 via `curl` and Swagger.
- **Codebase Knowledge Graph**: Synchronized and indexed via `graphify update .`.
