import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure storage
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = (req.query.folder as string) || 'general';
    const uploadPath = path.join(STORAGE_PATH, folder);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload single file
router.post('/image', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const folder = (req.query.folder as string) || 'general';
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
  const publicUrl = `${baseUrl}/uploads/${folder}/${req.file.filename}`;

  res.json({
    success: true,
    url: publicUrl,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
}));

// Upload multiple files
router.post('/images', upload.array('files', 10), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.files || !Array.isArray(req.files)) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const folder = (req.query.folder as string) || 'general';
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

  const uploadedFiles = req.files.map(file => ({
    url: `${baseUrl}/uploads/${folder}/${file.filename}`,
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }));

  res.json({
    success: true,
    files: uploadedFiles,
  });
}));

// Delete file
router.delete('/', asyncHandler(async (req: AuthRequest, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Extract file path from URL
  const urlPath = new URL(url).pathname;
  const filePath = path.join(process.cwd(), urlPath);

  // Security check - ensure path is within uploads directory
  const uploadsDir = path.resolve(STORAGE_PATH);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath);
  }

  res.json({ success: true });
}));

export default router;
