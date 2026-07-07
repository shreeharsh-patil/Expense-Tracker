const request = require('supertest');
const mongoose = require('mongoose');

const { CustomCategory, Expense } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestExpense, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const categoriesRouter = require('../routes/categories');

describe('Categories Routes', () => {
  let app;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  afterEach(async () => { await clearTestDb(); });
  beforeEach(() => { app = createTestApp(); });

  describe('GET /categories', () => {
    it('should render the categories page when authenticated', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/categories');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Custom Categories');
    });

    it('should display created categories with usage counts', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const cat = new CustomCategory({ user_id: user._id, name: 'Groceries', color: '#22c55e' });
      await cat.save();

      // Create an expense using this category
      await createTestExpense(user._id, { category: 'Groceries' });

      const res = await agent.get('/categories');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Groceries');
      expect(res.text).toContain('1 expense');
    });

    it('should show empty state when no categories', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/categories');
      expect(res.status).toBe(200);
      expect(res.text).toContain('No Custom Categories');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/categories');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /categories/add', () => {
    it('should create a new category', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/categories/add')
        .type('form')
        .send({
          name: 'Groceries',
          icon: 'category',
          color: '#22c55e',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/categories');

      const cat = await CustomCategory.findOne({ name: 'Groceries' });
      expect(cat).toBeTruthy();
      expect(cat.color).toBe('#22c55e');
    });

    it('should reject category with short name', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/categories/add')
        .type('form')
        .send({ name: 'A', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/categories');
    });

    it('should reject duplicate category name', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await new CustomCategory({ user_id: user._id, name: 'Groceries', color: '#22c55e' }).save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/categories/add')
        .type('form')
        .send({ name: 'Groceries', csrf_token: token });

      expect(res.status).toBe(302);
    });
  });

  describe('POST /categories/:id/edit', () => {
    it('should update an existing category', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const cat = await new CustomCategory({ user_id: user._id, name: 'Old Name', color: '#6366f1' }).save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/categories/${cat._id}/edit`)
        .type('form')
        .send({
          name: 'New Name',
          icon: 'work',
          color: '#f59e0b',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/categories');

      const updated = await CustomCategory.findById(cat._id);
      expect(updated.name).toBe('New Name');
      expect(updated.color).toBe('#f59e0b');
    });

    it('should update expense categories when category is renamed', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const cat = await new CustomCategory({ user_id: user._id, name: 'Old Cat', color: '#6366f1' }).save();
      const expense = await createTestExpense(user._id, { category: 'Old Cat' });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post(`/categories/${cat._id}/edit`)
        .type('form')
        .send({ name: 'New Cat', icon: 'category', color: '#22c55e', csrf_token: token });

      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.category).toBe('New Cat');
    });
  });

  describe('POST /categories/:id/delete', () => {
    it('should delete a category and reassign expenses to Other', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const cat = await new CustomCategory({ user_id: user._id, name: 'To Delete', color: '#ef4444' }).save();
      const expense = await createTestExpense(user._id, { category: 'To Delete' });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/categories/${cat._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/categories');

      const deleted = await CustomCategory.findById(cat._id);
      expect(deleted).toBeNull();

      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.category).toBe('Other');
    });
  });

  describe('GET /api/categories', () => {
    it('should return categories as JSON', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await new CustomCategory({ user_id: user._id, name: 'API Cat', color: '#6366f1' }).save();

      const res = await agent.get('/api/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('API Cat');
    });

    it('should return empty array when not authenticated', async () => {
      app.use('/', categoriesRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
