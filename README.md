# Localified

Community marketplace for short-term local jobs and errands. Formerly **Local Job Finder**.

## Quick start (local)

```bash
npm install
npm run dev
```

This starts Vite and a local `json-server` on port `3001` as a **fallback** when Supabase env vars are not set.

Demo accounts (local auth only):

- `ana@example.com` / `password123` (client)
- `ben@example.com` / `password123` (runner)

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run, in order:
   - `supabase/schema.sql`
   - `supabase/seed.sql` (optional sample jobs)
3. Copy **Project URL** and **anon public** key from **Settings → API**.
4. Create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

5. For easier local testing, disable email confirmation under **Authentication → Providers → Email**.
6. Under **Authentication → URL Configuration**, add your site URLs (e.g. `http://localhost:5173` and your Vercel domain).

With those env vars present, the app uses Supabase Auth + `profiles` / `jobs` / `applications` instead of json-server.

## Vercel deploy

1. Import this repo in Vercel.
2. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. Add the same env vars as production:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy after saving env vars.
5. Add the Vercel URL to Supabase **Redirect URLs** / **Site URL**.

`vercel.json` already rewrites all routes to `index.html` for React Router.

## Scripts

| Command           | Purpose                  |
| ----------------- | ------------------------ |
| `npm run dev`     | Vite + json-server       |
| `npm run server`  | json-server only         |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |

## Revision log

See [`CHANGES.md`](./CHANGES.md) for the latest integration notes.
