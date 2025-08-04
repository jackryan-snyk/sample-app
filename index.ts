import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';

export const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.use(express.static('public'));

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Sanitize the filename to prevent XSS attacks
  res.send(`File uploaded: ${xss(req.file.filename)}`);
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename || !/^[a-zA-Z0-9.-]+$/.test(safeFilename)) {
    return res.status(400).send('Invalid filename');
  }
  const filePath = path.join(__dirname, 'uploads', safeFilename);
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', () => {
    res.status(404).send('File not found');
  });
  fileStream.pipe(res);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
