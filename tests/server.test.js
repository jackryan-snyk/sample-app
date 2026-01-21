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
const binaryParser = (res, callback) => {
    res.setEncoding('binary');
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        callback(null, Buffer.from(data, 'binary'));
    });
};
describe('PDF Upload/Download', () => {
    const uploadDir = path_1.default.join(__dirname, '../uploads');
    const tempDir = path_1.default.join(__dirname, '../temp');
    let server;
    beforeAll((done) => {
        server = index_1.app.listen(done);
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
    });
    afterAll((done) => {
        fs_1.default.rmSync(uploadDir, { recursive: true, force: true });
        fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        server.close(done);
    });
    it('should upload a valid PDF, then be able to download it', () => __awaiter(void 0, void 0, void 0, function* () {
        const testPdfPath = path_1.default.join(__dirname, 'test.pdf');
        const uploadRes = yield (0, supertest_1.default)(server)
            .post('/upload')
            .attach('pdf', testPdfPath);
        expect(uploadRes.statusCode).toBe(200);
        expect(uploadRes.text).toContain('File uploaded:');
        const filename = uploadRes.text.split(': ')[1];
        const downloadedFilePath = path_1.default.join(tempDir, filename);
        const downloadRes = yield (0, supertest_1.default)(server)
            .get(`/download/${filename}`)
            .parse(binaryParser);
        expect(downloadRes.statusCode).toBe(200);
        fs_1.default.writeFileSync(downloadedFilePath, downloadRes.body);
        const originalFile = fs_1.default.readFileSync(testPdfPath);
        const downloadedFile = fs_1.default.readFileSync(downloadedFilePath);
        expect(originalFile).toEqual(downloadedFile);
    }));
    it('should not upload an invalid file type', () => __awaiter(void 0, void 0, void 0, function* () {
        const testJpgPath = path_1.default.join(__dirname, 'test.jpg');
        const res = yield (0, supertest_1.default)(server)
            .post('/upload')
            .attach('pdf', testJpgPath);
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('No file uploaded.');
    }));
    it('should return 404 for a non-existing PDF file', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server).get('/download/nonexistent.pdf');
        expect(res.statusCode).toBe(404);
    }));
});
