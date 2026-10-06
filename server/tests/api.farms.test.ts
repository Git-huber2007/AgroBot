import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API Integration Tests', () => {
  const app = createApp();

  it('GET /api/v1/health returns 200 with status ok and version', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
  });

  it('GET /api/v1/farms without Authorization header returns 401', async () => {
    const res = await request(app).get('/api/v1/farms');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/nonexistent returns 404 with structured error envelope', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('POST /api/v1/farms without token returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/farms')
      .send({ name: 'Test Farm' });
    expect(res.status).toBe(401);
  });
});
