const request = require('supertest');
const mongoose = require('mongoose');

const { Expense, RecurringExpense } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestExpense, createTestAccount, createTestTag, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const expensesRouter = require('../routes/expenses');
const authRouter = require('../routes/auth');

describe('Expense Routes', () => {
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
  // GET /expenses/add
  // ------------------------------------------------------------------ //
  describe('GET /expenses/add', () => {
    it('should render the add expense form when authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/expenses/add');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Record Transaction');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/expenses/add');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /expenses/add
  // ------------------------------------------------------------------ //
  describe('POST /expenses/add', () => {
    it('should create a new expense with valid data', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/expenses/add')
        .type('form')
        .send({
          amount: '45.50',
          category: 'Food',
          payment_method: 'Cash',
          description: 'Lunch at cafe',
          date: '2026-07-15',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const expense = await Expense.findOne({ user_id: user._id });
      expect(expense).toBeTruthy();
      expect(Number(expense.amount)).toBe(45.50);
      expect(expense.category).toBe('Food');
      expect(expense.description).toBe('Lunch at cafe');
    });

    it('should reject invalid amount (zero)', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/expenses/add')
        .type('form')
        .send({
          amount: '0',
          category: 'Food',
          date: '2026-07-15',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/expenses/add');
    });

    it('should reject invalid date format', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/expenses/add')
        .type('form')
        .send({
          amount: '25.00',
          category: 'Food',
          date: '15-07-2026',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/expenses/add');
    });

    it('should create expense with account reference', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const account = await createTestAccount(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/expenses/add')
        .type('form')
        .send({
          amount: '150.00',
          category: 'Bills',
          payment_method: 'Bank',
          description: 'Electricity bill',
          date: '2026-07-10',
          currency: 'INR',
          account_id: account._id.toString(),
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const expense = await Expense.findOne({ user_id: user._id, account_id: account._id });
      expect(expense).toBeTruthy();
    });

    it('should create expense with tags', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const tag = await createTestTag(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/expenses/add')
        .type('form')
        .send({
          amount: '75.00',
          category: 'Shopping',
          payment_method: 'Credit Card',
          description: 'New shoes',
          date: '2026-07-20',
          currency: 'INR',
          tag_ids: [tag._id.toString()],
          csrf_token: token
        });

      expect(res.status).toBe(302);

      const expense = await Expense.findOne({ user_id: user._id });
      expect(expense.tags.length).toBe(1);
      expect(expense.tags[0].toString()).toBe(tag._id.toString());
    });
  });

  // ------------------------------------------------------------------ //
  // GET /expenses/:id/edit
  // ------------------------------------------------------------------ //
  describe('GET /expenses/:id/edit', () => {
    it('should render edit form for existing expense', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const expense = await createTestExpense(user._id);

      const res = await agent.get(`/expenses/${expense._id}/edit`);
      expect(res.status).toBe(200);
      expect(res.text).toContain('Modify Transaction');
    });

    it('should redirect for non-existent expense', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await agent.get(`/expenses/${fakeId}/edit`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });

    it('should redirect for invalid ObjectId', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/expenses/invalid-id/edit');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /expenses/:id/edit
  // ------------------------------------------------------------------ //
  describe('POST /expenses/:id/edit', () => {
    it('should update an existing expense', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const expense = await createTestExpense(user._id, {
        amount: 50.00,
        description: 'Original description'
      });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/expenses/${expense._id}/edit`)
        .type('form')
        .send({
          amount: '75.00',
          category: 'Transport',
          payment_method: 'Bank',
          description: 'Updated description',
          date: '2026-07-16',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const updated = await Expense.findById(expense._id);
      expect(Number(updated.amount)).toBe(75.00);
      expect(updated.category).toBe('Transport');
      expect(updated.description).toBe('Updated description');
    });

    it('should reject update with invalid amount', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const expense = await createTestExpense(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/expenses/${expense._id}/edit`)
        .type('form')
        .send({
          amount: '-10',
          category: 'Food',
          date: '2026-07-16',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/edit');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /expenses/:id/delete
  // ------------------------------------------------------------------ //
  describe('POST /expenses/:id/delete', () => {
    it('should delete an existing expense', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const expense = await createTestExpense(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/expenses/${expense._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const deleted = await Expense.findById(expense._id);
      expect(deleted).toBeNull();
    });

    it('should redirect for non-existent expense', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const fakeId = new mongoose.Types.ObjectId();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/expenses/${fakeId}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  // ------------------------------------------------------------------ //
  // GET /expenses/export
  // ------------------------------------------------------------------ //
  describe('GET /expenses/export', () => {
    it('should export expenses as CSV', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      await createTestExpense(user._id, {
        amount: 100.00,
        category: 'Food',
        description: 'Test item',
        date: '2026-07-01'
      });

      const res = await agent.get('/expenses/export');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('Date,Category,Description,Amount,Currency');
      expect(res.text).toContain('Food');
    });

    it('should return CSV with header only when no expenses', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/expenses/export');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Date,Category,Description,Amount,Currency');
    });
  });

  // ------------------------------------------------------------------ //
  // GET /recurring
  // ------------------------------------------------------------------ //
  describe('GET /recurring', () => {
    it('should render recurring page when authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const res = await agent.get('/recurring');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Recurring Commitments');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/recurring');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /recurring/add
  // ------------------------------------------------------------------ //
  describe('POST /recurring/add', () => {
    it('should create a recurring expense schedule', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/recurring/add')
        .type('form')
        .send({
          amount: '199.00',
          category: 'Bills',
          payment_method: 'Bank',
          description: 'Netflix',
          day_of_month: '15',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/recurring');

      const rec = await RecurringExpense.findOne({});
      expect(rec).toBeTruthy();
      expect(Number(rec.amount)).toBe(199.00);
      expect(rec.day_of_month).toBe(15);
    });

    it('should reject invalid day of month', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/recurring/add')
        .type('form')
        .send({
          amount: '100.00',
          category: 'Bills',
          day_of_month: '32',
          currency: 'INR',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/recurring');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /recurring/:id/delete
  // ------------------------------------------------------------------ //
  describe('POST /recurring/:id/delete', () => {
    it('should delete a recurring schedule', async () => {
      app.use('/', authRouter);
      app.use('/', expensesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const rec = new RecurringExpense({
        user_id: user._id,
        amount: 50.00,
        category: 'Bills',
        day_of_month: 1,
        currency: 'INR'
      });
      await rec.save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/recurring/${rec._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/recurring');

      const deleted = await RecurringExpense.findById(rec._id);
      expect(deleted).toBeNull();
    });
  });
});
