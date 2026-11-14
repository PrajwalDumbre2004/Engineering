# Samarth Engineering Works – Parts Tracker

Monorepo: `client/` (React + Vite + Tailwind) and `server/` (Express + MongoDB). See [PLAN.md](PLAN.md) for the design.

## Setup

```bash
npm install
cp server/.env.example server/.env   # then edit JWT_SECRET and ADMIN_* values
npm run seed                          # creates the single admin (needs MongoDB running)
npm run dev                           # API on :5000, web app on :5173
```

Open http://localhost:5173 and sign in with the admin login from `.env`.

## Using it

1. **Admin** → *Add company* → enter name, short code and first member → copy the generated Login ID + password (shown once).
2. Open the company → add projects, then open a project to add parts and change their status.
3. Share the credentials with the client; they sign in and see only their company's projects (read-only).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | server (watch mode) + client together |
| `npm run seed` | create the admin if none exists |
| `npm run build` | production build of the client into `client/dist` |
| `npm start` | run the API (set `NODE_ENV=production`) |
