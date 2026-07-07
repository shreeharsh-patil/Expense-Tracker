const request = require('supertest');
const mongoose = require('mongoose');

const { User, Expense, Income } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestExpense, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const dashboardRouter = require('../routes/dashboard');

describe('Dashboard Routes', () => {
  let app;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  afterEach(async () => { await clearTestDb(); });
  beforeEach(() => { app = createTestApp(); });

  describe('GET /dashboard', () => {
    it('should render the dashboard when authenticated', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/dashboard');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Welcome');
      expect(res.text).toContain('Test User');
    });

    it('should display current month stats', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await createTestExpense(user._id, { amount: 500, category: 'Food', date: '2026-07-05' });
      await createTestExpense(user._id, { amount: 300, category: 'Transport', date: '2026-07-10' });

      const res = await agent.get('/dashboard');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Monthly Burn');
    });

    it('should handle search query filter', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await createTestExpense(user._id, { description: 'Lunch at cafe', date: '2026-07-05' });
      await createTestExpense(user._id, { description: 'Bus pass', date: '2026-07-06' });

      const res = await agent.get('/dashboard?q=cafe');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Lunch at cafe');
    });

    it('should handle category filter', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await createTestExpense(user._id, { category: 'Food', date: '2026-07-05' });
      await createTestExpense(user._id, { category: 'Transport', date: '2026-07-06' });

      const res = await agent.get('/dashboard?category=Food');
      expect(res.status).toBe(200);
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/dashboard');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /budget/update', () => {
    it('should update the monthly budget', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/budget/update')
        .type('form')
        .send({ budget: '25000', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const updated = await User.findById(user._id);
      expect(updated.monthly_budget).toBe(25000);
    });

    it('should reject invalid budget values', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/budget/update')
        .type('form')
        .send({ budget: '-100', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  describe('GET /reports', () => {
    it('should render reports page when authenticated', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/reports');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Financial');
    });

    it('should display annual data', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await createTestExpense(user._id, { amount: 1000, date: '2026-01-15' });
      await createTestExpense(user._id, { amount: 2000, date: '2026-06-20' });

      const res = await agent.get('/reports?year=2026');
      expect(res.status).toBe(200);
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', dashboardRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/reports');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
});
