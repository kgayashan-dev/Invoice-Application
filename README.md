# Invoice Application

Full-stack Invoice Management Application with Next.js frontend, ASP.NET Core (.NET 8) Web API backend, and Microsoft SQL Server (MSSQL) database with Entity Framework Core.

---

## Project Structure

```text
Invoice-Application/
├── backend/                  # ASP.NET Core 8 Web API
│   ├── Controllers/          # API Controllers (Invoices, Health)
│   ├── Data/                 # AppDbContext & EF Core Configurations
│   ├── Migrations/           # EF Core Database Migrations
│   ├── Models/               # Domain Models (Invoice, InvoiceItem)
│   ├── Properties/           # Launch settings & profile configurations
│   ├── appsettings.json      # Connection strings & App configuration
│   └── Program.cs            # App pipeline, DI, CORS, EF Core setup
│
├── frontend/                 # Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/              # App Router pages & layouts
│   │   ├── services/         # API client & fetch helpers
│   │   └── types/            # TypeScript interfaces
│   ├── .env.local            # Local environment variables
│   └── package.json          # Dependencies (Tailwind CSS, React 19)
│
├── docker-compose.yml        # Local MSSQL Server Docker container setup
└── README.md
```

---

## Prerequisites

- **.NET 8.0 SDK**: `dotnet --version`
- **Node.js 18+ & npm**: `node -v && npm -v`
- **Docker**: For running Microsoft SQL Server (`mssql-container` or docker-compose)

---

## 1. Database Setup (MSSQL)

The application is configured to connect to Microsoft SQL Server running on `localhost:1433` with database `InvoiceAppDb`.

If you are running MSSQL via Docker:
```bash
docker compose up -d
```
*(Or use your existing running MSSQL container on port 1433 with password `Orson@123`)*.

Database migrations are already created and will auto-apply when the backend starts, or you can apply them manually:
```bash
cd backend
dotnet ef database update
```

---

## 2. Backend Setup (.NET 8 Web API)

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Restore and run the API:
   ```bash
   dotnet run --launch-profile http
   ```
3. API is available at:
   - **Base URL:** `http://localhost:5038`
   - **Swagger UI:** `http://localhost:5038/swagger`
   - **Health Check:** `http://localhost:5038/api/health`

---

## 3. Frontend Setup (Next.js)

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (if needed):
   ```bash
   npm install
   ```
3. Verify or adjust `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5038
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
