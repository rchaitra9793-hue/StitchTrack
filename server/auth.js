import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'dev-secret';

export function login(req, res) {
  const expected = process.env.OWNER_PASSWORD || 'admin123';
  if (req.body?.password !== expected) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ role: 'owner' }, secret(), { expiresIn: '7d' });
  res.json({ token });
}

export function requireOwner(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Please log in' });
  }
}
