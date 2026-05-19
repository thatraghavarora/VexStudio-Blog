# VexStudio-Blog

Dark cinematic game-studio blog with a Supabase-backed admin console.

## Run

```bash
npm install
npm run dev
```

Public blog: `/`

Admin panel: `/admin`

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create an admin user in Supabase Authentication.
4. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Restart the dev server.

Without env keys, the app runs in local demo mode using browser storage.
