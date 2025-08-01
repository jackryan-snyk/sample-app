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
const helmet_1 = __importDefault(require("helmet"));
exports.app = (0, express_1.default)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
exports.app.use((0, helmet_1.default)());
exports.app.use(express_1.default.urlencoded({ extended: false }));
exports.app.use(express_1.default.static('public'));
exports.app.post('/upload', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.filename}`);
});
exports.app.get('/download/*', (req, res) => {
    const requestedPath = req.params[0];
    const filename = decodeURIComponent(requestedPath);
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).send('Invalid filename');
    }
    const uploadsDir = path_1.default.resolve(__dirname, 'uploads');
    const filePath = path_1.default.resolve(uploadsDir, filename);
    if (!filePath.startsWith(uploadsDir + path_1.default.sep)) {
        return res.status(400).send('Invalid filename');
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
