import { Router } from 'express';
import db, { generateTrackingCode } from '../db.js';
import { requireOwner } from '../auth.js';

const router = Router();

const STATUSES = ['Pending', 'Stitching', 'Ready', 'Delivered'];
const GARMENTS = ['blouse', 'kurti'];

const toOrder = (row) => row && { ...row, measurements: JSON.parse(row.measurements) };

function validateOrder(body) {
  const { customer_name, phone, garment_type, measurements, due_date } = body ?? {};
  if (!customer_name?.trim()) return 'Customer name is required';
  if (!/^\d{10}$/.test(phone ?? '')) return 'Phone must be 10 digits';
  if (!GARMENTS.includes(garment_type)) return 'Garment must be blouse or kurti';
  if (!measurements || typeof measurements !== 'object') return 'Measurements are required';
  const values = Object.values(measurements);
  if (values.length === 0 || values.some((v) => !(Number(v) > 0))) {
    return 'All measurements must be positive numbers';
  }
  if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) return 'Due date must be YYYY-MM-DD';
  return null;
}

// ---------- Public (customer) routes ----------

router.post('/', (req, res) => {
  const error = validateOrder(req.body);
  if (error) return res.status(400).json({ error });

  const { customer_name, phone, garment_type, measurements, design_notes = '', due_date = null } =
    req.body;
  const tracking_code = generateTrackingCode();

  const result = db
    .prepare(
      `INSERT INTO orders (customer_name, phone, garment_type, measurements, design_notes, due_date, tracking_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      customer_name.trim(),
      phone,
      garment_type,
      JSON.stringify(measurements),
      design_notes.trim(),
      due_date || null,
      tracking_code
    );

  res.status(201).json({ id: result.lastInsertRowid, tracking_code });
});

// Returning customer: last measurements for this phone + garment
router.get('/lookup', (req, res) => {
  const { phone, garment_type } = req.query;
  if (!/^\d{10}$/.test(phone ?? '') || !GARMENTS.includes(garment_type)) {
    return res.status(400).json({ error: 'Valid phone and garment_type are required' });
  }
  const row = db
    .prepare(
      `SELECT customer_name, measurements FROM orders
       WHERE phone = ? AND garment_type = ? ORDER BY id DESC LIMIT 1`
    )
    .get(phone, garment_type);
  if (!row) return res.status(404).json({ error: 'No saved measurements' });
  res.json({ customer_name: row.customer_name, measurements: JSON.parse(row.measurements) });
});

// Customer checks status with their tracking code (only non-sensitive fields)
router.get('/track/:code', (req, res) => {
  const row = db
    .prepare(
      `SELECT id, customer_name, garment_type, status, due_date, created_at, price, advance
       FROM orders WHERE tracking_code = ?`
    )
    .get(req.params.code.toUpperCase());
  if (!row) return res.status(404).json({ error: 'No order found for this code' });

  const { customer_name, price, advance, ...order } = row;
  res.json({
    ...order,
    first_name: customer_name.split(' ')[0],
    balance: Math.max(price - advance, 0),
  });
});

// ---------- Owner routes ----------

router.get('/', requireOwner, (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status && STATUSES.includes(status)) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (customer_name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  // Active orders first, most urgent due date on top
  sql += ` ORDER BY status = 'Delivered', due_date IS NULL, due_date, id DESC`;

  res.json(db.prepare(sql).all(...params).map(toOrder));
});

router.get('/:id', requireOwner, (req, res) => {
  const order = toOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update status and/or payment details
router.patch('/:id', requireOwner, (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  const { status = existing.status, price = existing.price, advance = existing.advance } =
    req.body ?? {};

  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!(Number(price) >= 0) || !(Number(advance) >= 0)) {
    return res.status(400).json({ error: 'Price and advance must be 0 or more' });
  }
  if (Number(advance) > Number(price)) {
    return res.status(400).json({ error: 'Advance cannot be more than the price' });
  }

  db.prepare('UPDATE orders SET status = ?, price = ?, advance = ? WHERE id = ?').run(
    status,
    Number(price),
    Number(advance),
    req.params.id
  );
  res.json(toOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireOwner, (req, res) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.status(204).end();
});

export default router;
