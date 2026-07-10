# Supabase Setup Guide

Complete step-by-step guide to connect your Supabase project to the Saree ERP system.

---

## Step 1 — Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create a free account).
2. Click **"New Project"**.
3. Fill in:
   - **Organization**: Select or create your organization
   - **Project Name**: `saree-erp` (or any name you like)
   - **Database Password**: Set a strong password. **Save it securely.**
   - **Region**: Choose `South Asia (Mumbai)` → `ap-south-1` for lowest latency in India
4. Click **"Create new project"**.
5. Wait ~2 minutes for it to provision.

---

## Step 2 — Get Your API Keys

1. In your Supabase project, go to **Settings → API**.
2. Copy:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **Anon (public) key** → a long JWT string

3. Create a `.env.local` file in the project root:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env.local
```

Then edit `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME="Saree ERP"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENV="development"
VITE_WA_LINK_BASE="https://wa.me"
```

---

## Step 3 — Run the Database Migrations

Run all migration files **in order** in the Supabase SQL Editor.

1. Go to **SQL Editor** in your Supabase dashboard.
2. Click **"New query"**.
3. Copy and paste each migration file, then click **"Run"**:

| Order | File | Description |
|-------|------|-------------|
| 1 | `supabase/migrations/001_initial_schema.sql` | All 28 tables, indexes, constraints |
| 2 | `supabase/migrations/002_rls_policies.sql` | Row Level Security policies |
| 3 | `supabase/migrations/003_functions_triggers.sql` | Triggers, functions, views |
| 4 | `supabase/migrations/004_seed_data.sql` | Demo company, categories, brands |

> ⚠️ **Run in this exact order.** Each file depends on the previous one.

---

## Step 4 — Create the Super Admin User

1. In Supabase, go to **Authentication → Users**.
2. Click **"Add user"** → **"Create new user"**.
3. Fill in:
   - **Email**: `admin@example.com` (or your own)
   - **Password**: *Choose a strong password*

### 2. Run the Fix Script

Once the user is created in the Auth Dashboard, copy and paste the contents of `fix_admin_profile.sql` into the Supabase SQL Editor and click **Run**.

*(You may need to modify the email in the script if you didn't use `admin@example.com`)*

```sql
-- Inside fix_admin_profile.sql:
WHERE email = 'admin@example.com';
```

> Replace `admin@example.com` with the email you used.

---

## Step 5 — Configure Supabase Auth Settings

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-domain.com/**`

---

## Step 6 — Set Up Storage Buckets

1. Go to **Storage** in Supabase.
2. Create these **public** buckets:
   - `product-images`
   - `logos`
   - `avatars`
   - `documents`

For each bucket:
- Click **"New bucket"**
- Enter the bucket name
- ✅ Check **"Public bucket"**
- Click **"Create bucket"**

---

## Step 7 — Start the Development Server

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

Login with the super admin credentials you created in Step 4.

---

## Step 8 — Verify Everything Works

After logging in, you should see:
- ✅ Login page with smooth animation
- ✅ Redirect to Dashboard after login
- ✅ Sidebar with navigation (role-filtered)
- ✅ Dark/Light mode toggle
- ✅ Shop switcher in topbar
- ✅ Your company name in sidebar footer

---

## Troubleshooting

### "Supabase URL not set" error
→ Check that `.env.local` exists and has the correct values. Restart the dev server.

### Login says "Invalid login credentials"
→ Make sure you created the user in Supabase Auth and **Auto Confirm User** was checked.

### Profile not found after login
→ The `handle_new_user` trigger may have failed. Run the UPDATE query in Step 4 again.

### RLS errors in console
→ Make sure the profile's `company_id` is set and matches the seed company ID.

---

## Production Deployment (Vercel)

1. Push code to GitHub.
2. Import repo in Vercel.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_ENV=production`
4. Deploy.
5. Update Supabase Auth **Site URL** and **Redirect URLs** to your Vercel domain.
