import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const app = express();

app.use(helmet());
app.disable('x-powered-by');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename format' });
  }
  
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('%')) {
    return res.status(400).json({ error: 'Invalid filename characters' });
  }
  
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const filePath = path.resolve(uploadsDir, filename);
  
  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return res.status(400).json({ error: 'Access denied' });
  }
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', () => {
    res.status(404).json({ error: 'File not found' });
  });
  fileStream.pipe(res);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
