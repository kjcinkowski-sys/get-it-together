# Deploying Get-It-Together

The app is three pieces that run on three services:

| Piece | Host | Notes |
| --- | --- | --- |
| Angular frontend | **Vercel** | Static SPA build |
| .NET API | **Render** (or Railway / Fly) | Vercel cannot run ASP.NET Core |
| PostgreSQL | **Neon** | Free, doesn't expire; provision directly or via the Vercel marketplace |

Do them in this order: **database → API → frontend**, because each one needs the URL of the previous.

---

## 1. Database (Neon)

1. Create a Postgres database — either at [neon.tech](https://neon.tech) directly, or from your
   Vercel project under **Storage → Marketplace → Neon** (same Neon, billed through Vercel).
2. Copy the connection string. Neon gives you a URI like:

   ```
   postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/dbname
   ```

3. **Convert it to Npgsql's keyword format** — the .NET driver does not accept the URI form:

   ```
   Host=ep-cool-name.us-east-2.aws.neon.tech;Database=dbname;Username=user;Password=pass;SSL Mode=Require;Trust Server Certificate=true
   ```

   `SSL Mode=Require` is mandatory for managed Postgres. Keep this string secret — it goes in the
   API's environment variables (next step), never in the repo.

You don't run migrations by hand: with `MigrateOnStartup=true` the API creates its schema on first boot.

---

## 2. API (Render)

Deploy the `backend/` project as a **Web Service**. It already has a [Dockerfile](backend/Dockerfile);
point Render at the repo and set the root/Dockerfile path to `backend/`.

Set these **environment variables** on the service (double underscores map to nested config keys):

| Variable | Value |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | the converted Npgsql string from step 1 |
| `Jwt__SigningKey` | a long random secret (≥ 32 chars) |
| `Jwt__Issuer` | `IdentityHabits.Api` |
| `MigrateOnStartup` | `true` |
| `Cors__AllowedOrigins__0` | your frontend URL, e.g. `https://get-it-together.vercel.app` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

On first deploy the API connects to Neon and creates the tables automatically. Note its public URL
(e.g. `https://get-it-together-api.onrender.com`) — the frontend needs it next.

> **Cold starts:** Render's free web services sleep after ~15 min idle, so the first request after a
> lull takes ~30s. Fine for demos; upgrade or use Railway/Fly if that bothers testers.

---

## 3. Frontend (Vercel)

Import the repo into Vercel and set the **Root Directory** to `frontend`. The committed
[frontend/vercel.json](frontend/vercel.json) already handles the build command, the output directory
(`dist/frontend/browser`), and the SPA rewrite that keeps deep links like `/login` working on refresh.

Set one **environment variable** in the Vercel project:

| Variable | Value |
| --- | --- |
| `API_URL` | your API URL **with `/api`**, e.g. `https://get-it-together-api.onrender.com/api` |

At build time [frontend/set-env.js](frontend/set-env.js) bakes `API_URL` into the app. If you don't set
it, the build falls back to the default in `src/environments/environment.ts`.

---

## Checklist / gotchas

- **CORS 403s** — the single most common failure. The frontend URL on Vercel must exactly match
  `Cors__AllowedOrigins__0` on the API (scheme + host, no trailing slash). Update it if you add a
  custom domain.
- **`API_URL` must include `/api`** — the backend routes are all under `/api/...`.
- **Rotate the JWT secret** — don't reuse the dev placeholder from `appsettings.Development.json`.
- **Free Postgres reality** — Neon doesn't delete your data but auto-suspends when idle (wakes in ~1s).
  Render's own free Postgres, by contrast, is deleted after 30 days — which is why the DB is on Neon.
