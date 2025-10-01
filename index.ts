import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

export const app = express();
app.disable('x-powered-by');

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // accept PDFs only
    if (file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    cb(null, false);
  },
});

app.use(express.static('public'));

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Avoid reflecting user-controlled values unescaped
  res.send(`File uploaded: ${req.file.filename}`);
});

const downloadLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

app.get('/download/:filename', downloadLimiter, (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const requested = path.normalize(req.params.filename);

  // Block absolute paths and traversal attempts
  if (path.isAbsolute(requested) || requested.includes('..')) {
    return res.status(400).send('Invalid file path');
  }

  const resolvedPath = path.resolve(uploadsDir, requested);
  if (!resolvedPath.startsWith(uploadsDir + path.sep)) {
    return res.status(400).send('Invalid file path');
  }

  const fileStream = fs.createReadStream(resolvedPath);
  fileStream.on('error', () => {
    res.status(404).send('File not found');
  });
  fileStream.pipe(res);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});