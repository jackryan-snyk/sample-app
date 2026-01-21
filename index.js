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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.app = (0, express_1.default)();
// Configure multer with file size limits (10MB max)
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1, // Only allow 1 file per request
        fields: 10, // Limit number of non-file fields
        parts: 11 // Limit total number of parts
    },
    fileFilter: (req, file, cb) => {
        // Only allow PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    }
});
// Apply rate limiting to prevent abuse
const uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many upload requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
const downloadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 downloads per windowMs
    message: 'Too many download requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
// Set request body size limits
exports.app.use(express_1.default.json({ limit: '1mb' }));
exports.app.use(express_1.default.urlencoded({ limit: '1mb', extended: true }));
exports.app.use(express_1.default.static('public'));
exports.app.post('/upload', uploadLimiter, upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded: ${req.file.filename}`);
});
exports.app.get('/download/:filename', downloadLimiter, (req, res) => {
    const filePath = path_1.default.join(__dirname, 'uploads', req.params.filename);
    // Check file size before streaming
    fs_1.default.stat(filePath, (err, stats) => {
        if (err) {
            return res.status(404).send('File not found');
        }
        // Limit download file size to 50MB
        const maxDownloadSize = 50 * 1024 * 1024;
        if (stats.size > maxDownloadSize) {
            return res.status(413).send('File too large to download');
        }
        const fileStream = fs_1.default.createReadStream(filePath, {
            highWaterMark: 64 * 1024 // 64KB chunks to prevent memory issues
        });
        let bytesRead = 0;
        fileStream.on('data', (chunk) => {
            bytesRead += chunk.length;
            // Additional safety check during streaming
            if (bytesRead > maxDownloadSize) {
                fileStream.destroy();
                res.status(413).send('File size limit exceeded');
            }
        });
        fileStream.on('error', () => {
            res.status(404).send('File not found');
        });
        fileStream.pipe(res);
    });
});
// Handle multer errors (file size exceeded, etc.)
exports.app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).send('File size exceeds the 10MB limit.');
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).send('Too many files uploaded.');
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).send('Unexpected file field.');
        }
        return res.status(400).send(`Upload error: ${err.message}`);
    }
    next(err);
});
// Only start the server if not in test mode
if (require.main === module) {
    exports.app.listen(3000, () => {
        console.log('Server listening on port 3000');
    });
}
