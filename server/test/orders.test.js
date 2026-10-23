import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const blouse = {
  customer_name: 'Priya Sharma',
  phone: '9876543210',
  garment_type: 'blouse',
  measurements: { bust: 34, waist: 30, shoulder: 14 },
  design_notes: 'Boat neck',
  due_date: '2030-01-15',
};

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const res = await request(app).post('/api/login').send({ password: 'test-password' });
  token = res.body.token;
});

describe('auth', () => {
  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/login').send({ password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('blocks owner routes without a token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('creating orders', () => {
  it('creates an order and returns a tracking code', async () => {
    const res = await request(app).post('/api/orders').send(blouse);
    expect(res.status).toBe(201);
    expect(res.body.tracking_code).toMatch(/^[A-Z2-9]{6}$/);
  });

  it.each([
    [{ phone: '12345' }, 'Phone must be 10 digits'],
    [{ customer_name: ' ' }, 'Customer name is required'],
    [{ garment_type: 'saree' }, 'Garment must be blouse or kurti'],
    [{ measurements: { bust: -2 } }, 'All measurements must be positive numbers'],
  ])('rejects invalid input %o', async (override, error) => {
    const res = await request(app).post('/api/orders').send({ ...blouse, ...override });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(error);
  });
});

describe('tracking and lookup', () => {
  it('lets a customer track an order without exposing private details', async () => {
    const { body } = await request(app).post('/api/orders').send(blouse);
    const res = await request(app).get(`/api/orders/track/${body.tracking_code.toLowerCase()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ first_name: 'Priya', status: 'Pending' });
    expect(res.body.phone).toBeUndefined();
    expect(res.body.measurements).toBeUndefined();
  });

  it('returns 404 for an unknown tracking code', async () => {
    const res = await request(app).get('/api/orders/track/ZZZZZZ');
    expect(res.status).toBe(404);
  });

  it('finds saved measurements for a returning customer', async () => {
    const res = await request(app)
      .get('/api/orders/lookup')
      .query({ phone: blouse.phone, garment_type: 'blouse' });
    expect(res.status).toBe(200);
    expect(res.body.measurements).toEqual(blouse.measurements);
  });

  it('has nothing saved for a garment the customer never ordered', async () => {
    const res = await request(app)
      .get('/api/orders/lookup')
      .query({ phone: blouse.phone, garment_type: 'kurti' });
    expect(res.status).toBe(404);
  });
});

describe('managing orders', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app).post('/api/orders').send({ ...blouse, phone: '9000000001' });
    id = res.body.id;
  });

  it('updates status', async () => {
    const res = await request(app).patch(`/api/orders/${id}`).set(auth()).send({ status: 'Ready' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Ready');
  });

  it('saves price and advance', async () => {
    const res = await request(app)
      .patch(`/api/orders/${id}`)
      .set(auth())
      .send({ price: 1200, advance: 500 });
    expect(res.body).toMatchObject({ price: 1200, advance: 500, status: 'Ready' });
  });

  it('rejects an advance larger than the price', async () => {
    const res = await request(app)
      .patch(`/api/orders/${id}`)
      .set(auth())
      .send({ price: 500, advance: 800 });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid status', async () => {
    const res = await request(app).patch(`/api/orders/${id}`).set(auth()).send({ status: 'Lost' });
    expect(res.status).toBe(400);
  });

  it('filters by status and search', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set(auth())
      .query({ status: 'Ready', search: '9000000001' });
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(id);
  });

  it('deletes an order', async () => {
    const del = await request(app).delete(`/api/orders/${id}`).set(auth());
    expect(del.status).toBe(204);
    const res = await request(app).get(`/api/orders/${id}`).set(auth());
    expect(res.status).toBe(404);
  });
});
