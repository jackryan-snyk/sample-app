import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { param, validationResult } from 'express-validator';

export const app = express();

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

const upload = multer({ dest: 'uploads/' });

// Security: Rate limiting for all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Security: Rate limiting for file operations
const fileOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 file operations per windowMs
  message: 'Too many file operations from this IP, please try again later.'
});

app.use(limiter);
app.use(express.static('public'));

app.post('/upload', fileOperationLimiter, upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  // Security: Prevent XSS by using JSON response instead of string interpolation
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename 
  });
});

app.get('/download/:filename', 
  fileOperationLimiter,
  param('filename').isAlphanumeric().withMessage('Invalid filename format'),
  (req, res) => {
    // Security: Validate input to prevent path traversal
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    const filename = req.params.filename;
    
    // Security: Additional path traversal protection
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const uploadsDir = path.resolve(__dirname, 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    // Security: Ensure the resolved path is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', () => {
      res.status(404).json({ error: 'File not found' });
    });
    fileStream.pipe(res);
  }
);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});