# Deployment Guide

This guide will help you deploy your portfolio to Vercel with Supabase backend.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier is perfect)
- A [Vercel](https://vercel.com) account (free tier works great)
- A GitHub account to host your code

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Project name: `portfolio` (or whatever you like)
   - Database password: (generate a strong one)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

### 1.2 Create the Photos Table

1. In your Supabase dashboard, go to **Table Editor**
2. Click "Create a new table"
3. Table name: `photos`
4. Add these columns:
   - `id` (int8, primary key, auto-increment) - already there
   - `created_at` (timestamptz, default: now()) - already there
   - `title` (text, not null)
   - `category` (text, not null)
   - `file_path` (text, not null)
   - `url` (text, not null)
   - `original_name` (text)
5. Click "Save"

### 1.3 Set Up Row Level Security (RLS)

1. In the Table Editor, click on your `photos` table
2. Click the **RLS** toggle to enable it
3. Click "Add RLS policy"
4. Create a policy for **SELECT**:
   - Policy name: `Public read access`
   - Target roles: `public`
   - Policy command: `SELECT`
   - Policy expression: `true`
5. Click "Review" then "Save policy"

### 1.4 Create Storage Bucket

1. Go to **Storage** in the sidebar
2. Click "New bucket"
3. Name: `portfolio-photos`
4. Public bucket: **Yes** (toggle on)
5. Click "Create bucket"

### 1.5 Set Storage Policies

1. Click on your `portfolio-photos` bucket
2. Go to **Policies** tab
3. Create a policy for **SELECT** (public read):
   - Policy name: `Public read`
   - Policy definition: Check "SELECT"
   - Target roles: `public`
   - Policy expression: `true`
4. Create a policy for **INSERT** (authenticated upload):
   - Policy name: `Authenticated upload`
   - Policy definition: Check "INSERT"
   - Target roles: `authenticated`
   - Policy expression: `true`
5. Save both policies

### 1.6 Get Your Supabase Credentials

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 2: Set Up Authentication

### 2.1 Create Your Admin User

1. In Supabase dashboard, go to **Authentication** > **Users**
2. Click "Add user" > "Create new user"
3. Enter:
   - Email: Your email address
   - Password: A strong password (you'll use this to login)
   - Email confirm: Toggle OFF (so you can login immediately)
4. Click "Create user"

## Step 3: Configure Your Local Environment

1. In your portfolio project, open `.env.local`
2. Add your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 4: Test Locally

1. Start the dev server:
```bash
npm run dev
```

2. Visit `http://localhost:5173/login`
3. Login with the email/password you created in Supabase
4. Try uploading a photo at `/admin`
5. Check if it appears on `/photography`

## Step 5: Deploy to Vercel

### 5.1 Push to GitHub

1. Create a new repository on GitHub
2. In your terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 5.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Click "Import"
5. Configure project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - Click "Environment Variables"
   - Add `VITE_SUPABASE_URL` = your Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` = your anon key
7. Click "Deploy"

### 5.3 Wait for Deployment

Vercel will build and deploy your site (~2 minutes). You'll get a URL like:
`https://your-portfolio.vercel.app`

## Step 6: Test Your Live Site

1. Visit your Vercel URL
2. Go to `/login` and sign in
3. Upload a photo at `/admin`
4. Check it displays on `/photography`

## Step 7: Add a Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS

## Uploading from Your Phone

Once deployed, you can upload photos from anywhere:

1. On your phone, visit `https://your-portfolio.vercel.app/login`
2. Login with your credentials
3. Go to `/admin`
4. Upload photos directly from your camera or gallery!

## Troubleshooting

### "Failed to fetch photos"
- Check that RLS policies are set correctly on the `photos` table
- Verify your environment variables are set in Vercel

### "Upload failed"
- Ensure storage bucket is public
- Check storage policies allow authenticated uploads
- Verify you're logged in

### Login doesn't work
- Make sure you created a user in Supabase Authentication
- Check that email is confirmed (or confirmation is disabled)
- Verify environment variables are correct

## Managing Your Portfolio

- **View photos**: Visit your photography page
- **Upload photos**: Login and go to `/admin`
- **View analytics**: Check Vercel Analytics in your dashboard
- **Monitor**: Check Supabase logs for any errors

## Costs

With normal personal use, everything stays **FREE**:
- Vercel: Free tier includes 100GB bandwidth
- Supabase: Free tier includes 500MB database + 1GB storage

## Need Help?

Check the logs:
- **Vercel**: Dashboard > Your Project > Deployments > View Function Logs
- **Supabase**: Dashboard > Logs > Postgres Logs

Congratulations! Your portfolio is now live! 🎉
