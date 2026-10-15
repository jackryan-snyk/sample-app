"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.usersRouter = void 0;
const express_1 = __importDefault(require("express"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
exports.usersRouter = express_1.default.Router();
// In-memory SQLite store for users.
exports.db = new better_sqlite3_1.default(':memory:');
exports.db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);
exports.usersRouter.use(express_1.default.json());
// Create a user
exports.usersRouter.post('/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).send('name and email are required');
    }
    const info = exports.db
        .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .run(name, email);
    const user = exports.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(info.lastInsertRowid);
    res.status(201).json(user);
});
// List users, with optional name search
exports.usersRouter.get('/users', (req, res) => {
    const search = req.query.search;
    if (typeof search === 'string' && search.length > 0) {
        const rows = exports.db
            .prepare('SELECT * FROM users WHERE name LIKE ?')
            .all(`%${search}%`);
        return res.json(rows);
    }
    const rows = exports.db.prepare('SELECT * FROM users').all();
    res.json(rows);
});
// Columns that may be referenced as identifiers in filter/sort.
// Identifiers cannot be parameterized, so they are validated against this allowlist.
const FILTERABLE_COLUMNS = ['id', 'name', 'email'];
// Filter users by an allowed field/value, with optional sorting (admin tooling)
exports.usersRouter.get('/users/filter', (req, res) => {
    const { field, value, sortBy, order } = req.query;
    if (typeof field !== 'string' || typeof value !== 'string') {
        return res.status(400).send('field and value are required');
    }
    if (!FILTERABLE_COLUMNS.includes(field)) {
        return res.status(400).send('invalid field');
    }
    // The value is bound as a parameter; only the validated column name is inlined.
    let query = `SELECT * FROM users WHERE ${field} = ?`;
    if (typeof sortBy === 'string' && sortBy.length > 0) {
        if (!FILTERABLE_COLUMNS.includes(sortBy)) {
            return res.status(400).send('invalid sortBy');
        }
        query += ` ORDER BY ${sortBy} ${order === 'desc' ? 'DESC' : 'ASC'}`;
    }
    const rows = exports.db.prepare(query).all(value);
    res.json(rows);
});
// Read a single user
exports.usersRouter.get('/users/:id', (req, res) => {
    const user = exports.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(req.params.id);
    if (!user) {
        return res.status(404).send('User not found');
    }
    res.json(user);
});
// Update a user
exports.usersRouter.put('/users/:id', (req, res) => {
    const { name, email } = req.body;
    const existing = exports.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(req.params.id);
    if (!existing) {
        return res.status(404).send('User not found');
    }
    exports.db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name !== null && name !== void 0 ? name : existing.name, email !== null && email !== void 0 ? email : existing.email, req.params.id);
    const updated = exports.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(req.params.id);
    res.json(updated);
});
// Delete a user
exports.usersRouter.delete('/users/:id', (req, res) => {
    const info = exports.db
        .prepare('DELETE FROM users WHERE id = ?')
        .run(req.params.id);
    if (info.changes === 0) {
        return res.status(404).send('User not found');
    }
    res.status(204).send();
});
