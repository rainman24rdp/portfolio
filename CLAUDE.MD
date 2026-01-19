# CLAUDE.MD

This file provides context for Claude AI when working on this portfolio project.

## Project Overview

A modern React portfolio website with a photography gallery and admin photo upload system. The site is built with React 19 + Vite on the frontend and Express on the backend, with Supabase for production authentication and storage.

## Tech Stack

### Frontend
- **React 19** - Latest React with React Router DOM for navigation
- **Vite** - Fast build tool and dev server
- **CSS** - Custom styling with dark theme and gradient accents

### Backend
- **Express** - Node.js API server for local development
- **Multer** - File upload handling (local dev)
- **Supabase** - Production authentication and cloud storage
  - Supabase Auth for admin login
  - Supabase Storage for photo CDN
  - PostgreSQL for photo metadata

## Project Structure

```
portfolio/
├── src/
│   ├── pages/           # Main page components (Home, About, Projects, Photography, Admin)
│   ├── components/      # Reusable React components (Navigation, PhotoUpload, etc.)
│   ├── contexts/        # React Context providers (AuthContext)
│   ├── lib/             # Utility modules (supabaseClient.js)
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── uploads/             # Local photo storage (dev only)
├── server.js            # Express backend (local dev)
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel deployment config
└── supabase-setup.sql   # Database schema for production
```

## Key Files

- **server.js** - Express server with photo upload API (port 3001, local dev only)
- **src/lib/supabaseClient.js** - Supabase client configuration for production
- **src/contexts/AuthContext.jsx** - Authentication state management
- **src/pages/Admin.jsx** - Photo upload interface with auth protection
- **src/pages/Photography.jsx** - Photo gallery display
- **supabase-setup.sql** - SQL schema for photos table and storage bucket
- **.env.local** - Local environment variables (not committed)
- **.env.example** - Template for required environment variables

## Development Workflow

### Running Locally

The app requires **two processes** running simultaneously:

```bash
# Terminal 1 - Frontend (port 5173)
npm run dev

# Terminal 2 - Backend (port 3001)
npm run server
```

### Environment Variables

Local development uses `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_PASSWORD=your_admin_password
```

## Deployment

The site is deployed to **Vercel** with **Supabase** for backend services.

### Production Setup
1. Supabase project provides auth, database, and storage
2. Vercel hosts the React frontend (static build)
3. No Express server in production - all API calls go to Supabase
4. Photos stored in Supabase Storage bucket with public CDN URLs

See **DEPLOYMENT.md** for complete deployment instructions.

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navigation.jsx`

### Modifying Styles
- Global styles: `src/index.css`
- Component-specific: inline styles or page CSS
- Theme colors: dark background with blue/purple gradients

### Working with Photos
- **Local dev**: Photos upload to `/uploads` directory via Express
- **Production**: Photos stored in Supabase Storage bucket
- Metadata stored in `photos` table (title, category, url, created_at)

## Authentication

The admin page is protected with authentication:
- **Local dev**: Password-only (VITE_ADMIN_PASSWORD)
- **Production**: Supabase Auth with email/password login
- AuthContext manages auth state across the app

## Database Schema

```sql
photos (
  id: bigint (primary key)
  title: text
  category: text
  url: text (Supabase Storage URL)
  created_at: timestamptz
)
```

## API Endpoints (Local Dev)

- `POST /api/upload` - Upload photo with multipart/form-data
  - Body: `photo` (file), `title` (string), `category` (string)
  - Returns: success status and photo data

## Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

Vercel auto-deploys on push to main branch.

## Important Notes

- Express server (`server.js`) is **NOT used in production** - only for local development
- All production photo uploads go through Supabase APIs
- The app uses React Router's BrowserRouter for client-side routing
- Photos are served from Supabase Storage CDN in production
- Admin password is stored in environment variables, not hardcoded

## Git Workflow

Current branch: `main`
- Commits should be clear and focused
- Use conventional commit messages when possible
- Production deploys automatically on push to main

## Dependencies to Know

- `@supabase/supabase-js` - Supabase client SDK
- `react-router-dom` - Client-side routing
- `multer` - File upload handling (dev only)
- `cors` - CORS middleware (dev only)
- `express` - Backend server (dev only)

## Customization Points

Users typically customize:
1. **About page** - Personal bio and information
2. **Projects page** - Portfolio project showcase
3. **Colors/theme** - CSS variables and gradient colors
4. **Navigation** - Add/remove menu items
5. **Photo categories** - Modify available categories in Admin.jsx

## Troubleshooting

- **Photos not uploading**: Check if both dev servers are running
- **Auth issues**: Verify Supabase credentials in .env.local
- **404 on refresh**: Vercel config handles client-side routing with rewrites
- **CORS errors**: Ensure CORS is enabled on server.js for local dev
