// utils/access.ts
// Finnect Digital Architecture: System Function / Menu Access IDs
// Grounded in dbo.GetMenuID stored procedure.

export const ACCESS_ID = {
  // Module 1: Overview
  DASHBOARD: 1001,

  // Module 2: Administration
  USER_MANAGEMENT: 1002,
  ROLE_ACCESS: 1004,
  ASSIGN_ROLES: 1005,
  CREATE_ROLES: 1008,

  // Module 3: Security & Auditing
  AUDIT_TRAIL: 2001,

  // Module 4: Settings
  SYSTEM_SETTINGS: 3001,

  // Module 5: Billing & Invoicing
  INVOICES: 8001,
} as const;
