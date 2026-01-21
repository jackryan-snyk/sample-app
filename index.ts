import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.filename}`);
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const uploadsDir = path.join(__dirname, 'uploads');
  const filePath = path.join(uploadsDir, filename);
  
  // Resolve the absolute path and check if it's within the uploads directory
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsDir = path.resolve(uploadsDir);
  
  // Prevent path traversal attacks
  if (!resolvedPath.startsWith(resolvedUploadsDir + path.sep) && resolvedPath !== resolvedUploadsDir) {
    return res.status(403).send('Access denied: Invalid file path');
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