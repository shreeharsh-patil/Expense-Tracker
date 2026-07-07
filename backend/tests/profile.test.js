const request = require('supertest');
const mongoose = require('mongoose');

const { User } = require('../models');
const { createTestApp, createTestUser, createAuthenticatedAgent, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const profileRouter = require('../routes/profile');
const authRouter = require('../routes/auth');

describe('Profile Routes', () => {
  let app;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  afterEach(async () => { await clearTestDb(); });
  beforeEach(() => { app = createTestApp(); });

  describe('GET /profile', () => {
    it('should render the profile page when authenticated', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/profile');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Profile Settings');
    });

    it('should display user information', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const res = await agent.get('/profile');
      expect(res.status).toBe(200);
      expect(res.text).toContain(user.name);
      expect(res.text).toContain(user.email);
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/profile');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /profile', () => {
    it('should update user profile', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/profile')
        .type('form')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+91 9876543210',
          preferred_currency: 'USD',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/profile');

      const updated = await User.findById(user._id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('updated@example.com');
      expect(updated.phone).toBe('+91 9876543210');
      expect(updated.preferred_currency).toBe('USD');
    });

    it('should reject short name', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/profile')
        .type('form')
        .send({
          name: 'A',
          email: 'test@example.com',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/profile');
    });

    it('should reject invalid email', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/profile')
        .type('form')
        .send({
          name: 'Valid Name',
          email: 'not-an-email',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/profile');
    });

    it('should reject duplicate email', async () => {
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      // Create another user with a conflicting email
      await createTestUser({ email: 'other@example.com', name: 'Other User' });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/profile')
        .type('form')
        .send({
          name: 'Test User',
          email: 'other@example.com',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/profile');
    });

    it('should update session user_name after profile update', async () => {
      app.use('/', authRouter);
      app.use('/', profileRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post('/profile')
        .type('form')
        .send({
          name: 'New Session Name',
          email: 'test@example.com',
          csrf_token: token
        });

      // Check that session reflects the new name
      const meRes = await agent.get('/api/auth/me');
      expect(meRes.body.user.name).toBe('New Session Name');
    });
  });
});
