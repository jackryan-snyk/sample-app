import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(helmet());
app.use(express.static('public'));

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many download requests, please try again later.'
});

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.json({ message: 'File uploaded successfully' });
});

app.get('/download/:filename', downloadLimiter, (req, res) => {
  const filename = req.params.filename;
  
  const allowedPattern = /^[a-zA-Z0-9._-]+$/;
  if (!allowedPattern.test(filename)) {
    return res.status(400).send('Invalid filename');
  }
  
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const safePath = path.join(uploadsDir, safeFilename);
  
  if (!safePath.startsWith(uploadsDir + path.sep)) {
    return res.status(400).send('Invalid filename');
  }
  
  try {
    if (!fs.existsSync(safePath)) {
      return res.status(404).send('File not found');
    }
    res.sendFile(safePath);
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
