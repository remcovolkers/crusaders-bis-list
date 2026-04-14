# Crusaders BIS List — Hosting Setup Guide

## Stack
- **Frontend**: Render Static Site (Angular)
- **Backend**: Render Web Service (NestJS)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Google OAuth 2.0 + JWT

---

## Stap 1: Google OAuth instellen

1. Ga naar https://console.developers.google.com
2. Maak een nieuw project aan: "Crusaders BIS List"
3. Ga naar "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Type: Web application
5. Authorized redirect URIs toevoegen:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Productie: `https://crusaders-bis-list-api.onrender.com/api/auth/google/callback`
6. Kopieer `Client ID` en `Client Secret`

---

## Stap 2: Supabase database aanmaken

1. Ga naar https://supabase.com en maak een gratis account
2. Maak een nieuw project aan: "crusaders-bis-list"
3. Wacht tot het project klaar is
4. Ga naar Settings → Database → Connection String → URI
5. Kopieer de connection string (formaat: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`)

---

## Stap 3: Render account en services

1. Ga naar https://render.com en koppel je GitHub account
2. Push je repository naar GitHub eerst:
   ```
   git init
   git add .
   git commit -m "Initial commit: Crusaders BIS List"
   git remote add origin https://github.com/JOUW_USERNAME/crusaders-bis-list.git
   git push -u origin main
   ```
3. Klik "New" → "Blueprint" → selecteer je repository → kies `render.yaml`
4. Render maakt automatisch beide services aan

### Environment variables instellen (Backend service):
| Variable | Waarde |
|---|---|
| DATABASE_URL | Je Supabase connection string |
| GOOGLE_CLIENT_ID | Van stap 1 |
| GOOGLE_CLIENT_SECRET | Van stap 1 |
| GOOGLE_CALLBACK_URL | `https://crusaders-bis-list-api.onrender.com/api/auth/google/callback` |
| FRONTEND_URL | `https://crusaders-bis-list-frontend.onrender.com` |

---

## Stap 4: Eerste admin instellen

Na de eerste deploy en login via Google:
1. Log in als de gewenste admin persoon
2. Open de Supabase SQL editor
3. Run: `UPDATE users SET roles = '{admin,raider}' WHERE email = 'jouw@email.com';`
4. Daarna kan deze admin via de UI andere admins aanwijzen

---

## Kosten overzicht

| Service | Tier | Kosten |
|---|---|---|
| Render Backend | Free (met cold starts) | €0/maand |
| Render Backend | Starter (geen cold starts) | ~€7/maand |
| Render Frontend | Free (static site) | €0/maand |
| Supabase | Free (pauseert na 1 week inactief) | €0/maand |
| **Totaal MVP** | | **€0–7/maand** |

---

## Lokaal draaien (development)

```bash
# Kopieer en vul environment variabelen in
cp .env.example .env

# Database opstarten (lokaal via Docker)
docker run -d --name postgres-local -e POSTGRES_PASSWORD=password -e POSTGRES_DB=crusaders_bis_list -p 5432:5432 postgres:16

# Backend
npx nx serve crusaders-bis-list

# Frontend (nieuwe terminal)
npx nx serve frontend
```

De app is dan bereikbaar op:
- Frontend: http://localhost:4200
- API: http://localhost:3000/api
