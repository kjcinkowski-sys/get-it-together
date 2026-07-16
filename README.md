# get-it-together

An identity-based habit tracker: habits are tied to an identity statement (e.g. "I am a runner"), and each day you check in on how you did. Screen time tracking is planned as a future addition; this prototype is habit tracking only.

See [`docs/prototype-plan.html`](docs/prototype-plan.html) for the full implementation plan and timeline.

## Stack

- **Backend**: ASP.NET Core 8 minimal API (`backend/`), EF Core + PostgreSQL, JWT auth.
- **Frontend**: Angular 19 SPA (`frontend/`).

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm
- [Docker](https://www.docker.com/) (for local Postgres)

## Local development

1. **Start Postgres**

   ```bash
   docker compose up -d
   ```

2. **Configure the backend**

   ```bash
   cp backend/appsettings.Development.json.example backend/appsettings.Development.json
   ```

   Edit `backend/appsettings.Development.json` and set `Jwt:SigningKey` to any long random string (this file is gitignored).

3. **Apply database migrations and run the API**

   ```bash
   cd backend
   dotnet ef database update
   dotnet run
   ```

   The API listens on `http://localhost:5069` (see `backend/Properties/launchSettings.json`) and serves Swagger UI at `/swagger` in development. `backend/IdentityHabits.Api.http` has ready-to-run sample requests (register → login → create identity → create habit → check in) if you use an editor with REST Client support.

4. **Run the frontend**

   ```bash
   cd frontend
   npm install
   npm start
   ```

   The Angular dev server runs on `http://localhost:4200` and talks to the API directly using the URL in `frontend/src/environments/environment.development.ts`.

## Project structure

```
backend/     ASP.NET Core API — models, EF Core migrations, auth, endpoints
frontend/    Angular SPA — core services/guards + feature screens
docs/        Implementation plan
docker-compose.yml   Local Postgres for development
```

## Deployment

- **Frontend**: deploy `frontend/` to Vercel (Root Directory = `frontend`, Angular preset auto-detected). Update `frontend/src/environments/environment.ts` with the deployed API URL before building for production.
- **Backend + database**: Vercel doesn't run long-lived ASP.NET Core processes or managed Postgres, so the API is deployed separately — see `backend/Dockerfile` and `.env.example` for the environment variables a host like Render needs (`ConnectionStrings__DefaultConnection`, `Jwt__SigningKey`, `Jwt__Issuer`, `Cors__AllowedOrigins__0`, `MigrateOnStartup`).
