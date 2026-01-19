-- Run this in your Supabase SQL Editor to set up everything at once
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- 1. Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  original_name TEXT
);

-- 2. Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for public read access
CREATE POLICY "Public read access" ON photos
  FOR SELECT
  TO public
  USING (true);

-- 4. Create policy for authenticated insert (optional, for admin uploads)
CREATE POLICY "Authenticated insert access" ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: You still need to create the storage bucket manually:
-- Go to Storage > New bucket > Name: "portfolio-photos" > Public: Yes
-- Then set storage policies in the UI for public read and authenticated upload
