import express from 'express';
import cors from 'cors';
import ordersRouter from './routes/orders.js';
import { login } from './auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/login', login);
app.use('/api/orders', ordersRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
