# SquashIQ PWA v2.0 - Supabase Setup Guide

This guide walks you through setting up Supabase for SquashIQ's cloud sync, authentication, and social features.

## 📋 Prerequisites

- A Supabase account (free tier is sufficient for development)
- A Google Cloud Platform account (for Google OAuth)
- Node.js and npm installed

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Organization**: Select or create an organization
   - **Name**: `squashiq-pwa` (or your preferred name)
   - **Database Password**: Generate a strong password (save this - you won't see it again!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Select **Free** tier (suitable for development and MVP)
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to provision

## 🗄️ Step 2: Run Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `src/db/supabase-schema.sql` in your code editor
4. Copy the **entire contents** of the SQL file
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see: "Success. No rows returned"
8. Verify tables were created: Go to **Table Editor** and you should see:
   - `user_profiles`
   - `players`
   - `venues`
   - `matches`
   - `games`
   - `rally_analyses`
   - `friendships`
   - `groups`
   - `group_members`
   - `leaderboard_cache`
   - `activity_log`

## 🔑 Step 3: Get Supabase API Credentials

1. Go to **Project Settings** (gear icon in left sidebar) → **API**
2. Copy the following values:
   - **Project URL**: Example: `https://abcdefghijklmnop.supabase.co`
   - **anon public** key: Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Open `.env.local` in your project root
4. Paste the values:
   ```bash
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Save the file

⚠️ **Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

## 🔐 Step 4: Configure Google OAuth

### 4.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
   - Click the project dropdown (top left)
   - Click **"New Project"**
   - Name: `SquashIQ PWA` (or your preferred name)
   - Click **"Create"**
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **"Enable"**
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - If prompted, configure the consent screen first:
     - Click **"Configure Consent Screen"**
     - Select **"External"** (unless you have a Google Workspace)
     - Fill in:
       - **App name**: SquashIQ
       - **User support email**: Your email
       - **Developer contact email**: Your email
     - Click **"Save and Continue"** through the remaining steps
     - Click **"Back to Dashboard"**
5. Now create the OAuth client ID:
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - **Application type**: Web application
   - **Name**: SquashIQ Web Client
   - **Authorized JavaScript origins**: (leave empty for now)
   - **Authorized redirect URIs**: Add your Supabase callback URL:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     Replace `YOUR_PROJECT_REF` with your actual Supabase project reference (from the Project URL)
   - Click **"Create"**
6. **Save the credentials**: Copy the **Client ID** and **Client Secret** (you'll need these in the next step)

### 4.2 Configure Google OAuth in Supabase

1. In your Supabase project dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list and click to expand
3. Enable Google:
   - Toggle **"Enable Sign in with Google"** to ON
4. Paste your Google credentials:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
5. Click **"Save"**

### 4.3 Add Supabase Redirect URI to Google Cloud Console

1. Go back to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Click **"Save"**

## ✅ Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app should start without errors. Check the browser console for:
   - ✅ No Supabase configuration warnings
   - ✅ Supabase client initialized successfully

3. Test authentication (after implementing US-P002):
   - Navigate to the auth page
   - Click "Sign in with Google"
   - Complete the Google sign-in flow
   - You should be redirected back to the app
   - Check Supabase dashboard → **Authentication** → **Users** to see your user account

## 📦 Step 6: Configure Storage Bucket (for US-P006)

The storage bucket `match-photos` is created automatically by the schema SQL. Verify it:

1. Go to **Storage** in Supabase dashboard
2. You should see a bucket named **match-photos**
3. Click on it and verify the RLS policies are active:
   - "Users can upload their own match photos"
   - "Users can view match photos"
   - "Users can delete their own match photos"

If the bucket doesn't exist, run this SQL manually:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-photos', 'match-photos', true)
ON CONFLICT (id) DO NOTHING;
```

## 🛠️ Development Tips

### Viewing Your Data

- **Table Editor**: Browse and edit data in your tables
- **SQL Editor**: Run custom queries to inspect data
- **Authentication**: View all registered users
- **Storage**: Browse uploaded photos

### Resetting the Database

To reset the database during development:

1. Go to **SQL Editor**
2. Run the schema SQL file again (it has `DROP TABLE IF EXISTS` statements)
3. This will delete all data and recreate tables

⚠️ **Warning**: Only do this in development! In production, you'll lose all user data.

### Monitoring

- **Logs**: View real-time logs of database queries and auth events
- **API**: Monitor API usage and rate limits (free tier: 50,000 requests/month)
- **Database**: Check database size and connection pool usage

## 🔒 Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Use Row Level Security**: All tables have RLS enabled - users can only access their own data
3. **Rotate keys**: If you accidentally expose your anon key, rotate it in Project Settings → API
4. **Use service_role key carefully**: Never expose the `service_role` key in client-side code (it bypasses RLS)

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

## 🐛 Troubleshooting

### "Supabase environment variables not configured" warning

- Check that `.env.local` exists and has the correct values
- Restart your dev server after changing `.env.local`
- Make sure there are no spaces around the `=` sign

### Google OAuth "redirect_uri_mismatch" error

- Ensure the redirect URI in Google Cloud Console matches your Supabase project URL exactly
- Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### "relation does not exist" database errors

- Run the schema SQL file in Supabase SQL Editor
- Check that all tables were created successfully in Table Editor

### RLS policy errors (403 Forbidden)

- Make sure you're authenticated (check `supabase.auth.getSession()`)
- Verify RLS policies are correctly set up in **Authentication** → **Policies**
- Check that `auth.uid()` matches the `user_id` in the table

### Storage upload fails

- Verify the `match-photos` bucket exists
- Check RLS policies on `storage.objects`
- Ensure file path format: `{userId}/{matchId}_{timestamp}.jpg`

## 🎯 Next Steps

After completing this setup:

1. ✅ Supabase project created
2. ✅ Database schema deployed
3. ✅ Environment variables configured
4. ✅ Google OAuth configured

You're ready to implement:
- **US-P002**: Authentication UI with Google Sign In
- **US-P003**: User profile creation
- **US-P004**: Data migration from IndexedDB
- **US-P005**: Bidirectional sync engine

Happy coding! 🚀
