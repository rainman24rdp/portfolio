import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Admin password from environment variable (required for security)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

// Store active sessions (in production, use Redis or a database)
const sessions = new Map();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Auth middleware for admin routes
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = sessions.get(token);
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  next();
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Auth routes
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  // Constant-time comparison to prevent timing attacks
  const passwordBuffer = Buffer.from(password);
  const adminBuffer = Buffer.from(ADMIN_PASSWORD);

  if (passwordBuffer.length !== adminBuffer.length ||
      !crypto.timingSafeEqual(passwordBuffer, adminBuffer)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  sessions.set(token, { expiresAt });

  res.json({ token, expiresAt });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }
  res.json({ message: 'Logged out' });
});

app.get('/api/admin/verify', requireAuth, (req, res) => {
  res.json({ valid: true });
});

// Routes (protected)
app.post('/api/upload', requireAuth, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, category } = req.body;
    
    const photoData = {
      id: Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      title: title || req.file.originalname,
      category: category || 'Uncategorized',
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    };

    // Save metadata to a JSON file
    const metadataPath = path.join(__dirname, 'photos-metadata.json');
    let metadata = [];
    
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf8');
      metadata = JSON.parse(data);
    }
    
    metadata.push(photoData);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({ 
      message: 'File uploaded successfully',
      photo: photoData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/photos', (req, res) => {
  try {
    const metadataPath = path.join(__dirname, 'photos-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.json([]);
    }
    
    const data = fs.readFileSync(metadataPath, 'utf8');
    const photos = JSON.parse(data);
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/photos/:id', requireAuth, (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const metadataPath = path.join(__dirname, 'photos-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const data = fs.readFileSync(metadataPath, 'utf8');
    let photos = JSON.parse(data);
    
    const photoIndex = photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Delete the actual file
    const photo = photos[photoIndex];
    const filePath = path.join(__dirname, 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from metadata
    photos.splice(photoIndex, 1);
    fs.writeFileSync(metadataPath, JSON.stringify(photos, null, 2));
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
