# Quick Start Guide

Your portfolio is now production-ready! Here's what you need to do next:

## ⚡ 5-Minute Setup

### 1. Create Supabase Account (2 min)
- Go to [supabase.com](https://supabase.com)
- Sign up and create a new project
- Wait for it to initialize

### 2. Run SQL Setup (1 min)
- In Supabase Dashboard → SQL Editor
- Copy/paste contents of `supabase-setup.sql`
- Click "Run"

### 3. Create Storage Bucket (1 min)
- Go to Storage → New Bucket
- Name: `portfolio-photos`
- Make it **public**
- Add policies (see DEPLOYMENT.md)

### 4. Create Admin User (30 sec)
- Go to Authentication → Users → Add User
- Enter your email & password
- Disable email confirmation

### 5. Get Credentials (30 sec)
- Go to Settings → API
- Copy Project URL and anon key
- Paste into `.env.local`:

```bash
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

## 🧪 Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173/login` and try uploading a photo!

## 🚀 Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push
```

2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repo
4. Add the same environment variables
5. Deploy!

## 📱 Use It

Your site will be live at `https://your-project.vercel.app`

- Login at `/login`
- Upload photos at `/admin`
- Photos appear on `/photography`

**Works from any device with internet!**

## 📖 Need More Details?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.

---

**Total time to deploy: ~10 minutes** ⏱️
