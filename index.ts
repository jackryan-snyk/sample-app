import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import csrf from 'csurf';

export const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(helmet());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.filename}`);
});

app.get('/download/*', (req, res) => {
  const requestedPath = (req.params as any)[0];
  const filename = decodeURIComponent(requestedPath);
  
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).send('Invalid filename');
  }
  
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const filePath = path.resolve(uploadsDir, filename);
  
  if (!filePath.startsWith(uploadsDir + path.sep)) {
    return res.status(400).send('Invalid filename');
  }
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', () => {
    res.status(404).send('File not found');
  });
  fileStream.pipe(res);
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
}
