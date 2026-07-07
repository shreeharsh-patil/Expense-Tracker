const request = require('supertest');
const mongoose = require('mongoose');

const { Income } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestAccount, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const incomeRouter = require('../routes/income');

describe('Income Routes', () => {
  let app;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  afterEach(async () => { await clearTestDb(); });
  beforeEach(() => { app = createTestApp(); });

  describe('GET /income/add', () => {
    it('should render the add income form when authenticated', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/income/add');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Record Income');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/income/add');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /income/add', () => {
    it('should create a new income entry with valid data', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/income/add')
        .type('form')
        .send({
          amount: '5000.00',
          source: 'Salary',
          description: 'Monthly salary',
          date: '2026-07-15',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const income = await Income.findOne({ user_id: user._id });
      expect(income).toBeTruthy();
      expect(Number(income.amount)).toBe(5000.00);
      expect(income.source).toBe('Salary');
    });

    it('should reject invalid amount (zero)', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/income/add')
        .type('form')
        .send({
          amount: '0',
          source: 'Salary',
          date: '2026-07-15',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/income/add');
    });

    it('should reject invalid date format', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/income/add')
        .type('form')
        .send({
          amount: '100.00',
          source: 'Freelance',
          date: '15-07-2026',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/income/add');
    });

    it('should create income with account reference', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const account = await createTestAccount(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/income/add')
        .type('form')
        .send({
          amount: '2500.00',
          source: 'Freelance',
          description: 'Web dev project',
          date: '2026-07-20',
          currency: 'INR',
          account_id: account._id.toString(),
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const income = await Income.findOne({ user_id: user._id, account_id: account._id });
      expect(income).toBeTruthy();
    });
  });

  describe('GET /income/:id/edit', () => {
    it('should render edit form for existing income', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const income = new Income({
        user_id: user._id, amount: 1000, source: 'Salary',
        date: '2026-07-01', currency: 'INR'
      });
      await income.save();

      const res = await agent.get(`/income/${income._id}/edit`);
      expect(res.status).toBe(200);
      expect(res.text).toContain('Edit Income');
    });

    it('should redirect for non-existent income', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const fakeId = new mongoose.Types.ObjectId();
      const res = await agent.get(`/income/${fakeId}/edit`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });

    it('should redirect for invalid ObjectId', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/income/invalid/edit');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  describe('POST /income/:id/edit', () => {
    it('should update an existing income entry', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const income = new Income({
        user_id: user._id, amount: 500, source: 'Salary',
        description: 'Original', date: '2026-07-01', currency: 'INR'
      });
      await income.save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/income/${income._id}/edit`)
        .type('form')
        .send({
          amount: '750.00', source: 'Freelance',
          description: 'Updated', date: '2026-07-15',
          currency: 'USD', csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const updated = await Income.findById(income._id);
      expect(Number(updated.amount)).toBe(750.00);
      expect(updated.source).toBe('Freelance');
      expect(updated.currency).toBe('USD');
    });
  });

  describe('POST /income/:id/delete', () => {
    it('should delete an existing income entry', async () => {
      app.use('/', incomeRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const income = new Income({
        user_id: user._id, amount: 1000, source: 'Salary',
        date: '2026-07-01', currency: 'INR'
      });
      await income.save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/income/${income._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const deleted = await Income.findById(income._id);
      expect(deleted).toBeNull();
    });
  });
});
