const request = require('supertest');
const { app } = require('../server');

describe('🌉 Skill Bridge Ethiopia API Tests', () => {
  describe('Health Check Endpoint', () => {
    it('GET /api/health should return 200 and running status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Skill Bridge Ethiopia API running');
    });

    it('GET /api/unregistered-route should return 404', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Authentication & Middleware Validation', () => {
    it('POST /api/auth/register should return 400 when missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('All fields are required');
    });

    it('POST /api/auth/login should return 400 when missing email or password', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email and password are required');
    });

    it('POST /api/auth/demo-login should reject invalid roles', async () => {
      const res = await request(app).post('/api/auth/demo-login').send({ role: 'invalid_role' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid demo role requested');
    });

    it('GET /api/courses/enrolled should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/courses/enrolled');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized');
    });

    it('GET /api/notifications should return 401 without Bearer token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized');
    });
  });
});
