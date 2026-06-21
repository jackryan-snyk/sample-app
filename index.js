"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.app = (0, express_1.default)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
exports.app.use(express_1.default.static('public'));
exports.app.post('/upload', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.filename}`);
});
exports.app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const uploadsDir = path_1.default.join(__dirname, 'uploads');
    const filePath = path_1.default.join(uploadsDir, filename);
    // Resolve the absolute path and check if it's within the uploads directory
    const resolvedPath = path_1.default.resolve(filePath);
    const resolvedUploadsDir = path_1.default.resolve(uploadsDir);
    // Prevent path traversal attacks
    if (!resolvedPath.startsWith(resolvedUploadsDir + path_1.default.sep) && resolvedPath !== resolvedUploadsDir) {
        return res.status(403).send('Access denied: Invalid file path');
    }
    const fileStream = fs_1.default.createReadStream(filePath);
    fileStream.on('error', () => {
        res.status(404).send('File not found');
    });
    fileStream.pipe(res);
});
if (require.main === module) {
    exports.app.listen(3000, () => {
        console.log('Server listening on port 3000');
    });
}
