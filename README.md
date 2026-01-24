# Parimal.io

My personal portfolio and photography showcase.

**Live at [parimal.io](https://parimal.io)**

## Tech Stack

- **Frontend**: React 19, React Router, Vite
- **Backend**: Supabase (Auth, Storage, PostgreSQL)
- **Hosting**: Vercel
- **Testing**: Vitest, React Testing Library

## Features

- Responsive photography gallery with masonry layout
- Lazy loading images with smooth transitions
- Admin dashboard for photo management
- Supabase authentication

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## License

MIT
