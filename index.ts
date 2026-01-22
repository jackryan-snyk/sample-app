import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

export const app = express();

// Resource limit constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BODY_SIZE = '10mb';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // max 100 requests per window
const UPLOAD_RATE_LIMIT_MAX = 10; // max 10 uploads per window
const DOWNLOAD_RATE_LIMIT_MAX = 50; // max 50 downloads per window

// Apply rate limiting to all requests
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter rate limiting to upload endpoint
const uploadLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: UPLOAD_RATE_LIMIT_MAX,
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to download endpoint
const downloadLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: DOWNLOAD_RATE_LIMIT_MAX,
  message: 'Too many download requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer with file size limits and file type validation
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow 1 file per upload
    fields: 10, // Limit number of non-file fields
    parts: 20, // Limit total number of parts
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Apply body size limits to all JSON and URL-encoded requests
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ limit: MAX_BODY_SIZE, extended: true }));

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.use(express.static('public'));

app.post('/upload', uploadLimiter, upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.filename}`);
});

app.get('/download/:filename', downloadLimiter, (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
  // Check if file exists and get its size
  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    
    // Enforce download size limit
    if (stats.size > MAX_FILE_SIZE) {
      return res.status(413).send('File too large to download');
    }
    
    // Create read stream with highWaterMark to control memory usage
    const fileStream = fs.createReadStream(filePath, {
      highWaterMark: 64 * 1024, // 64KB chunks
    });
    
    fileStream.on('error', () => {
      res.status(404).send('File not found');
    });
    
    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', 'application/pdf');
    
    fileStream.pipe(res);
  });
});

// Error handler for multer errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).send('File too large. Maximum size is 10MB.');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).send('Too many files. Only 1 file allowed per upload.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).send('Unexpected file field.');
    }
    return res.status(400).send(`Upload error: ${err.message}`);
  }
  next(err);
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
}