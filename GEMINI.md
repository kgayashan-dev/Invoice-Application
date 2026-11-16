# Enterprise Invoice Management Application - Project Scope & Changelog

## 1. Project Overview & Scope

The **Enterprise Invoice Management Application** is a production-grade, full-stack financial enterprise system designed to automate and govern the entire invoice lifecycle, role-based authorization, multi-currency accounting, organizational auditing, high-fidelity PDF invoice rendering (QuestPDF), and Excel reporting (ClosedXML).

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: ASP.NET Core 8 Web API (.NET 8.0), C#, ADO.NET with Microsoft SQL Server Stored Procedures
- **Document & Reporting Engines**:
  - **QuestPDF (2026.9.2)**: Native A4 PDF generation matching the sample invoice specification (`backend/sample invoice/invoice 01.pdf`).
  - **ClosedXML (0.105.1)**: Formatted Excel spreadsheet exports for invoice particulars and ledger summary reports.
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

### D. QuestPDF A4 Document Generation Engine
- Pixel-perfect replication of `backend/sample invoice/invoice 01.pdf` on standard A4 vertical format:
  - **Header**: Company legal name, physical address, phone, email, and tax identification number (TIN) on the left; user-selected Company Logo image on the top right.
  - **Title**: Prominent centered royal blue **`INVOICE`** headline.
  - **Customer Details ("BILL TO")**: Solid royal blue banner box with Contact Attention, Customer Name, and Billing Address.
  - **Metadata Table**: Bordered grid displaying `DATE`, `INVOICE No.`, `CUSTOMER ID`, and `CUSTOMER TIN`.
  - **Line Items / Particulars**: Royal blue table header (`DESCRIPTION` & `AMOUNT [Currency]`), zebra-striped rows, multi-line descriptions (service periods), and amounts.
  - **Summary**: Right-aligned subtotal, tax amount, and highlighted soft-blue total pill.
  - **Payment Information**: Boxed banking instructions containing Beneficiary Account Name, Account Number, Bank & Branch Name, and SWIFT Code.
  - **Signatory**: Selected user signature image, signatory name, "Authorized Signature", and "Finance Department".
- Server-side streaming endpoint: `POST /api/invoices/{id}/generate-pdf`.

### E. ClosedXML Excel Particulars & Ledger Reports
- Professional `.xlsx` spreadsheet generation with corporate themes, column auto-fitting, borders, and number formatting:
  - **Single Invoice Particulars**: `GET /api/invoices/{id}/export-excel` generates itemized breakdown sheet.
  - **All Invoices Summary & Particulars Ledger**: `GET /api/invoices/export-report-excel` generates multi-tab workbook with high-level invoice summaries and comprehensive line-item particulars.

### F. Multi-Asset Management (Logos & Signatures)
- Dedicated asset management system in **Settings** (`/main/settings`):
  - **Company Logos**: Upload multiple logos, view previews, designate default logo.
  - **Authorized Signatures**: Upload transparent signature PNGs, view previews, designate default signatory.
- Selectable dropdowns during invoice creation and print modal to pick which logo and signature are embedded onto the generated invoice.

### G. Intuitive Multi-Entry Invoice Creation UI
- Intuitive modal dialog (`InvoiceFormModal.tsx`) modeled directly after the physical sample invoice layout:
  - Header parameters (Invoice No, Issue Date, Due Date, Customer ID, Customer TIN).
  - Client "Bill To" details (Attention, Customer Name, Address).
  - Dynamic particulars grid: Add, remove, and edit multiple line-items with real-time Subtotal, Tax, and Total recalculations.
  - Dropdown selection of branding assets (Company Logo & Signatory).

---

## 3. Comprehensive Changelog

### Database & Stored Procedures (`backend/SQL/StoredProcedures.sql`)

1. **`[dbo].[AppAssets]` Table**:
   - Columns: `Id`, `AssetType` (`Logo` | `Signature`), `Name`, `FileName`, `ContentType`, `ImageData` (`NVARCHAR(MAX)`), `IsDefault`, `UploadedBy`, `CreatedAt`.
2. **`[dbo].[Invoices]` Schema Extensions**:
   - Added: `CustomerAddress`, `Attention`, `CustomerId`, `CustomerTin`, `TaxAmount`, `Subtotal`, `LogoId`, `SignatureId`, `BankName`, `BankAccountName`, `BankAccountNumber`, `BankSwiftCode`.
3. **Stored Procedures Created / Updated**:
   - `[dbo].[Get_App_Assets]`: Returns uploaded assets filtered by type.
   - `[dbo].[Insert_App_Asset]`: Inserts asset and handles default toggling.
   - `[dbo].[Delete_App_Asset]`: Deletes asset record.
   - `[dbo].[Set_Default_App_Asset]`: Updates default asset for a given category.
   - `[dbo].[Get_All_Invoices]` & `[dbo].[Get_Invoice_By_Id]`: Updated to project all new metadata, banking, and asset IDs.
   - `[dbo].[Insert_Invoice]`: Updated to accept and record all structured invoice fields.

---

### Backend API (`backend/`)

1. **Packages Added**:
   - `QuestPDF` (2026.9.2) - Native PDF rendering.
   - `ClosedXML` (0.105.1) - Excel report generation.
2. **Services (`backend/Services/`)**:
   - `QuestPdfInvoiceDocument.cs`: A4 document implementation matching `invoice 01.pdf`.
   - `ExcelExportService.cs`: ClosedXML generator for particulars and summary reports.
3. **Controllers**:
   - `AssetsController.cs` (New): `GET /api/Assets`, `POST /api/Assets/upload`, `DELETE /api/Assets/{id}`, `POST /api/Assets/{id}/set-default`.
   - `InvoicesController.cs`:
     - Added `POST /api/invoices/{id}/generate-pdf`: QuestPDF A4 output.
     - Added `GET /api/invoices/{id}/export-excel`: ClosedXML invoice particulars output.
     - Added `GET /api/invoices/export-report-excel`: ClosedXML ledger report output.
     - Enhanced `GetInvoices`, `GetInvoice`, `CreateInvoice` to support all extended fields.
4. **`Program.cs`**:
   - Configured QuestPDF community license and system font fallback.
   - Registered `ExcelExportService` dependency injection.

---

### Frontend (`frontend/src/`)

1. **Branding & Asset Manager (`frontend/src/components/settings/AssetManager.tsx`)**:
   - Visual upload card with file size/type validation, live thumbnail preview, and default asset selection.
2. **Settings Portal (`frontend/src/app/main/settings/page.tsx`)**:
   - Tabbed interface: "System Parameters & Banking", "Company Logos", and "Authorized Signatures".
3. **Structured Invoice Creation Modal (`frontend/src/components/invoices/InvoiceFormModal.tsx`)**:
   - Multi-entry particulars table with dynamic row addition/deletion, auto-calculation, and logo/signature pickers.
4. **Invoice Print & Export Modal (`frontend/src/components/invoices/InvoicePrintModal.tsx`)**:
   - Integrated **"QuestPDF (A4)"** and **"Excel (ClosedXML)"** export buttons.
   - Added logo and signature selection controls with real-time visual updates.
5. **Invoice Registry (`frontend/src/app/main/invoices/page.tsx`)**:
   - Added **"Export Report (Excel)"** global ledger download.
   - Wired `InvoiceFormModal` for invoice generation.
6. **API Client (`frontend/src/services/api.ts`)**:
   - Added `getAssets`, `uploadAsset`, `deleteAsset`, `setDefaultAsset`, `downloadInvoicePdf`, `downloadInvoiceExcel`, and `downloadAllInvoicesExcel`.

---

## 4. User Roles & Workflow Matrix

| Role | Key Capabilities | Invoice Workflow Action |
| :--- | :--- | :--- |
| **Admin** | Full system governance, role permissions, settings, audits, asset uploads | Can execute all actions across all stages |
| **Finance Manager** (`sarah`) | Invoicing dashboard, financial reviews, audit logs, Excel exports | Creates invoices, reviews particulars, issues **"Request Sign"** |
| **Billing Officer** (`Thusitha`) | Invoice operations, client billing, digital signature & PDF export | Selects signature, enters **Electronic Signature**, downloads **QuestPDF (A4)** |
| **Auditor** | Read-only compliance, system audit inspection | Monitors invoice audit trail, signature certification, and Excel exports |

---

## 5. Verification & Testing Summary

- **Frontend Compilation**: Verified via `npm run build --prefix frontend`. All 14 routes statically compiled with 0 errors.
- **Backend Compilation**: Verified via `dotnet build backend` with 0 errors and 0 warnings.
- **QuestPDF Testing**: Verified `POST /api/invoices/1/generate-pdf` and `POST /api/invoices/3/generate-pdf` producing valid 1-page A4 documents matching `invoice 01.pdf`.
- **ClosedXML Testing**: Verified `GET /api/invoices/1/export-excel` and `GET /api/invoices/export-report-excel` producing valid Microsoft Excel `.xlsx` files.
- **Asset Pipeline**: Verified image upload, base64 conversion, database storage, and rendering in QuestPDF.
