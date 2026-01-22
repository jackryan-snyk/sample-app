"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
describe('Resource Allocation Limits', () => {
    const uploadDir = path_1.default.join(__dirname, '../uploads');
    let server;
    beforeAll((done) => {
        server = index_1.app.listen(done);
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
    });
    afterAll((done) => {
        fs_1.default.rmSync(uploadDir, { recursive: true, force: true });
        server.close(done);
    });
    it('should reject files larger than 10MB', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a temporary large file (11MB)
        const largePath = path_1.default.join(__dirname, 'tmp_rovodev_large.pdf');
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
        fs_1.default.writeFileSync(largePath, largeBuffer);
        try {
            const res = yield (0, supertest_1.default)(server)
                .post('/upload')
                .attach('pdf', largePath);
            expect(res.statusCode).toBe(413);
            expect(res.text).toContain('File too large');
        }
        finally {
            // Clean up
            if (fs_1.default.existsSync(largePath)) {
                fs_1.default.unlinkSync(largePath);
            }
        }
    }));
    it('should reject non-PDF file types', () => __awaiter(void 0, void 0, void 0, function* () {
        const testJpgPath = path_1.default.join(__dirname, 'test.jpg');
        const res = yield (0, supertest_1.default)(server)
            .post('/upload')
            .attach('pdf', testJpgPath);
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('No file uploaded.');
    }));
    it('should apply rate limiting headers', () => __awaiter(void 0, void 0, void 0, function* () {
        const testPdfPath = path_1.default.join(__dirname, 'test.pdf');
        const res = yield (0, supertest_1.default)(server)
            .post('/upload')
            .attach('pdf', testPdfPath);
        // Check for rate limit headers
        expect(res.headers['ratelimit-limit']).toBeDefined();
        expect(res.headers['ratelimit-remaining']).toBeDefined();
    }));
    it('should handle download with proper headers', () => __awaiter(void 0, void 0, void 0, function* () {
        // First upload a file
        const testPdfPath = path_1.default.join(__dirname, 'test.pdf');
        const uploadRes = yield (0, supertest_1.default)(server)
            .post('/upload')
            .attach('pdf', testPdfPath);
        expect(uploadRes.statusCode).toBe(200);
        const filename = uploadRes.text.split(': ')[1];
        // Now download it
        const downloadRes = yield (0, supertest_1.default)(server)
            .get(`/download/${filename}`);
        expect(downloadRes.statusCode).toBe(200);
        expect(downloadRes.headers['content-length']).toBeDefined();
        expect(downloadRes.headers['content-type']).toBe('application/pdf');
    }));
    it('should reject requests with no file', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server)
            .post('/upload');
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('No file uploaded.');
    }));
});
