import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

export const app = express();
const upload = multer({ dest: 'uploads/' });

app.disable('x-powered-by');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many upload requests, please try again later.'
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many download requests, please try again later.'
});

app.use(express.static('public'));

app.post('/upload', uploadLimiter, upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

app.get('/download/:filename', downloadLimiter, (req, res) => {
  const filename = req.params.filename;
  
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).send('Invalid filename');
  }
  
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, 'uploads', safeFilename);
  
  const uploadsDir = path.join(__dirname, 'uploads');
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(uploadsDir)) {
    return res.status(400).send('Invalid file path');
  }
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', () => {
    res.status(404).send('File not found');
  });
  fileStream.pipe(res);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
