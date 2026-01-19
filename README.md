# Portfolio Website

A modern React portfolio website with photo upload capabilities.

## Features

- **Multi-page Navigation**: Home, About, Projects, Photography, and Admin pages
- **Photo Upload System**: Easy-to-use admin interface for uploading photos from any device
- **Backend API**: Express server with file upload handling
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean dark theme with gradient accents

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

Dependencies are already installed!

### Running the Application

You need to run **both** the frontend and backend simultaneously:

#### Terminal 1 - Frontend (React)
```bash
npm run dev
```
The frontend will run at `http://localhost:5173`

#### Terminal 2 - Backend (Express)
```bash
npm run server
```
The backend API will run at `http://localhost:3001`

## Usage

### Uploading Photos from Your Phone

1. Make sure both servers are running
2. On your phone, navigate to `http://YOUR_COMPUTER_IP:5173/admin`
   - To find your computer's IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
3. Drag and drop a photo or tap "Choose File"
4. Add a title and select a category
5. Tap "Upload Photo"
6. Your photo will now appear on the Photography page!

### Viewing Photos

Visit `http://localhost:5173/photography` to see all uploaded photos in a beautiful gallery layout.

## Available Routes

- `/` - Home page
- `/about` - About me
- `/projects` - Project showcase
- `/photography` - Photo gallery
- `/admin` - Photo upload interface

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Vite

### Backend
- Express
- Multer (file uploads)
- CORS

## Deployment

This portfolio is ready to deploy to production with Vercel and Supabase!

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.**

Quick overview:
1. Create a free Supabase project
2. Set up database table and storage bucket
3. Create an admin user for authentication
4. Deploy to Vercel with environment variables
5. Upload photos from anywhere after logging in!

## Customization

- Edit `src/pages/About.jsx` to add your personal information
- Update `src/pages/Projects.jsx` to showcase your projects
- Modify colors and styles in the CSS files to match your brand
- Replace placeholder content with your own

## Production Features

✅ **Authentication** - Secure admin login via Supabase Auth
✅ **Cloud Storage** - Photos stored in Supabase Storage with CDN
✅ **Database** - Photo metadata in PostgreSQL
✅ **Auto-deploy** - Push to GitHub → Auto deploys to Vercel
✅ **Mobile Upload** - Upload photos from any device after login
✅ **100% Free** - Vercel + Supabase free tiers are generous

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
