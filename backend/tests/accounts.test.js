const request = require('supertest');
const mongoose = require('mongoose');

const { Account, Expense, Income } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestAccount, createTestExpense, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const accountsRouter = require('../routes/accounts');
const authRouter = require('../routes/auth');

describe('Account Routes', () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  beforeEach(() => {
    app = createTestApp();
  });

  // ------------------------------------------------------------------ //
  // GET /accounts
  // ------------------------------------------------------------------ //
  describe('GET /accounts', () => {
    it('should render the accounts page when authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/accounts');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Accounts');
    });

    it('should display created accounts', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await createTestAccount(user._id, { name: 'HDFC Savings', type: 'bank' });
      await createTestAccount(user._id, { name: 'Cash Wallet', type: 'cash' });

      const res = await agent.get('/accounts');
      expect(res.status).toBe(200);
      expect(res.text).toContain('HDFC Savings');
      expect(res.text).toContain('Cash Wallet');
    });

    it('should show empty state when no accounts', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/accounts');
      expect(res.status).toBe(200);
      expect(res.text).toContain('No Accounts Yet');
    });

    it('should calculate balances from expenses and income', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const account = await createTestAccount(user._id, { name: 'Balance Account' });

      await createTestExpense(user._id, { amount: 100, account_id: account._id });
      await createTestExpense(user._id, { amount: 50, account_id: account._id });

      const income = new Income({
        user_id: user._id,
        amount: 500,
        source: 'Salary',
        date: '2026-07-01',
        currency: 'INR',
        account_id: account._id
      });
      await income.save();

      const res = await agent.get('/accounts');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Balance Account');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/accounts');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /accounts/add
  // ------------------------------------------------------------------ //
  describe('POST /accounts/add', () => {
    it('should create a new account with valid data', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/accounts/add')
        .type('form')
        .send({
          name: 'My New Account',
          type: 'bank',
          currency: 'USD',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');

      const account = await Account.findOne({ name: 'My New Account' });
      expect(account).toBeTruthy();
      expect(account.name).toBe('My New Account');
      expect(account.type).toBe('bank');
      expect(account.currency).toBe('USD');
    });

    it('should reject account with empty name', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/accounts/add')
        .type('form')
        .send({
          name: '',
          type: 'bank',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');
    });

    it('should default invalid type to bank', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post('/accounts/add')
        .type('form')
        .send({
          name: 'Invalid Type Account',
          type: 'nonexistent_type',
          currency: 'INR',
          csrf_token: token
        });

      const account = await Account.findOne({ name: 'Invalid Type Account' });
      expect(account.type).toBe('bank');
    });

    it('should default to INR currency', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post('/accounts/add')
        .type('form')
        .send({
          name: 'Default Currency Account',
          type: 'cash',
          csrf_token: token
        });

      const account = await Account.findOne({ name: 'Default Currency Account' });
      expect(account.currency).toBe('INR');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const res = await request(app)
        .post('/accounts/add')
        .type('form')
        .send({ name: 'Test' });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /accounts/:id/edit
  // ------------------------------------------------------------------ //
  describe('POST /accounts/:id/edit', () => {
    it('should update an existing account', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const account = await createTestAccount(user._id, {
        name: 'Old Name',
        type: 'cash',
        currency: 'INR'
      });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/accounts/${account._id}/edit`)
        .type('form')
        .send({
          name: 'Updated Name',
          type: 'bank',
          currency: 'USD',
          is_active: '1',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');

      const updated = await Account.findById(account._id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.type).toBe('bank');
      expect(updated.currency).toBe('USD');
      expect(updated.is_active).toBe(true);
    });

    it('should reject edit with empty name', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const account = await createTestAccount(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/accounts/${account._id}/edit`)
        .type('form')
        .send({
          name: '',
          type: 'bank',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');
    });

    it('should redirect for non-existent account', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const fakeId = new mongoose.Types.ObjectId();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/accounts/${fakeId}/edit`)
        .type('form')
        .send({
          name: 'New Name',
          type: 'bank',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');
    });

    it('should redirect for invalid ObjectId', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/accounts/invalid/edit')
        .type('form')
        .send({
          name: 'Name',
          type: 'bank',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /accounts/:id/delete
  // ------------------------------------------------------------------ //
  describe('POST /accounts/:id/delete', () => {
    it('should delete an existing account', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const account = await createTestAccount(user._id, { name: 'To Delete' });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/accounts/${account._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');

      const deleted = await Account.findById(account._id);
      expect(deleted).toBeNull();
    });

    it('should unlink expenses when account is deleted', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const account = await createTestAccount(user._id);
      const expense = await createTestExpense(user._id, { account_id: account._id });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post(`/accounts/${account._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.account_id).toBeNull();
    });

    it('should unlink income when account is deleted', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const account = await createTestAccount(user._id);
      const income = new Income({
        user_id: user._id,
        amount: 1000,
        source: 'Salary',
        date: '2026-07-01',
        currency: 'INR',
        account_id: account._id
      });
      await income.save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post(`/accounts/${account._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      const updatedIncome = await Income.findById(income._id);
      expect(updatedIncome.account_id).toBeNull();
    });

    it('should redirect for non-existent account', async () => {
      app.use('/', authRouter);
      app.use('/', accountsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const fakeId = new mongoose.Types.ObjectId();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/accounts/${fakeId}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/accounts');
    });
  });
});
