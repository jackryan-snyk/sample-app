import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

export const app = express();

// Configure multer with file size limits (10MB max)
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only allow 1 file per request
    fields: 10, // Limit number of non-file fields
    parts: 11 // Limit total number of parts
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Apply rate limiting to prevent abuse
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many upload requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 downloads per windowMs
  message: 'Too many download requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Set request body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.use(express.static('public'));

app.post('/upload', uploadLimiter, upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.filename}`);
});

app.get('/download/:filename', downloadLimiter, (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
  // Check file size before streaming
  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    
    // Limit download file size to 50MB
    const maxDownloadSize = 50 * 1024 * 1024;
    if (stats.size > maxDownloadSize) {
      return res.status(413).send('File too large to download');
    }
    
    const fileStream = fs.createReadStream(filePath, {
      highWaterMark: 64 * 1024 // 64KB chunks to prevent memory issues
    });
    
    let bytesRead = 0;
    
    fileStream.on('data', (chunk) => {
      bytesRead += chunk.length;
      // Additional safety check during streaming
      if (bytesRead > maxDownloadSize) {
        fileStream.destroy();
        res.status(413).send('File size limit exceeded');
      }
    });
    
    fileStream.on('error', () => {
      res.status(404).send('File not found');
    });
    
    fileStream.pipe(res);
  });
});

// Handle multer errors (file size exceeded, etc.)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).send('File size exceeds the 10MB limit.');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).send('Too many files uploaded.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).send('Unexpected file field.');
    }
    return res.status(400).send(`Upload error: ${err.message}`);
  }
  next(err);
});

// Only start the server if not in test mode
if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
}