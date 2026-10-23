import Database from 'better-sqlite3';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(process.env.DB_FILE || path.join(dir, 'stitch-track.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT    NOT NULL,
    phone         TEXT    NOT NULL,
    garment_type  TEXT    NOT NULL CHECK (garment_type IN ('blouse', 'kurti')),
    measurements  TEXT    NOT NULL,
    design_notes  TEXT    NOT NULL DEFAULT '',
    due_date      TEXT,
    status        TEXT    NOT NULL DEFAULT 'Pending',
    price         REAL    NOT NULL DEFAULT 0,
    advance       REAL    NOT NULL DEFAULT 0,
    tracking_code TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Bring databases created by older versions up to date
const columns = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
if (!columns.includes('price')) db.exec('ALTER TABLE orders ADD COLUMN price REAL NOT NULL DEFAULT 0');
if (!columns.includes('advance')) db.exec('ALTER TABLE orders ADD COLUMN advance REAL NOT NULL DEFAULT 0');
if (!columns.includes('tracking_code')) db.exec('ALTER TABLE orders ADD COLUMN tracking_code TEXT');

// No 0/O or 1/I so codes are easy to read out over the phone
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateTrackingCode() {
  return Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');
}

const missing = db.prepare('SELECT id FROM orders WHERE tracking_code IS NULL').all();
const setCode = db.prepare('UPDATE orders SET tracking_code = ? WHERE id = ?');
missing.forEach(({ id }) => setCode.run(generateTrackingCode(), id));

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders (tracking_code)');
db.exec('CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders (phone)');

export default db;
