const request = require('supertest');
const mongoose = require('mongoose');

const { Tag, Expense } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestExpense, createTestTag, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const tagsRouter = require('../routes/tags');

describe('Tags Routes', () => {
  let app;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  afterEach(async () => { await clearTestDb(); });
  beforeEach(() => { app = createTestApp(); });

  describe('GET /tags', () => {
    it('should render the tags page when authenticated', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/tags');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Tags');
    });

    it('should display created tags with usage counts', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const tag = await createTestTag(user._id);
      const expense = await createTestExpense(user._id);
      expense.tags = [tag._id];
      await expense.save();

      const res = await agent.get('/tags');
      expect(res.status).toBe(200);
      expect(res.text).toContain(tag.name);
      expect(res.text).toContain('1 expense');
    });

    it('should show empty state when no tags', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/tags');
      expect(res.status).toBe(200);
      expect(res.text).toContain('No Tags Yet');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/tags');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /tags/add', () => {
    it('should create a new tag', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/tags/add')
        .type('form')
        .send({ name: 'Tax Deductible', color: '#22c55e', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/tags');

      const tag = await Tag.findOne({ name: 'Tax Deductible' });
      expect(tag).toBeTruthy();
      expect(tag.color).toBe('#22c55e');
    });

    it('should reject tag with empty name', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/tags/add')
        .type('form')
        .send({ name: '', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/tags');
    });

    it('should reject duplicate tag name', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      await createTestTag(user._id, { name: 'Business' });

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/tags/add')
        .type('form')
        .send({ name: 'Business', csrf_token: token });

      expect(res.status).toBe(302);
    });
  });

  describe('POST /tags/:id/delete', () => {
    it('should delete a tag', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const tag = await createTestTag(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/tags/${tag._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/tags');

      const deleted = await Tag.findById(tag._id);
      expect(deleted).toBeNull();
    });

    it('should remove tag reference from expenses', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const tag = await createTestTag(user._id);
      const expense = await createTestExpense(user._id);
      expense.tags = [tag._id];
      await expense.save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post(`/tags/${tag._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.tags.length).toBe(0);
    });
  });

  describe('GET /api/tags', () => {
    it('should return tags as JSON', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      await createTestTag(user._id, { name: 'API Tag' });

      const res = await agent.get('/api/tags');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('API Tag');
    });

    it('should return empty array when not authenticated', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /tags/expense/:expense_id/set', () => {
    it('should set tags on an expense', async () => {
      app.use('/', tagsRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const expense = await createTestExpense(user._id);
      const tag = await createTestTag(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/tags/expense/${expense._id}/set`)
        .type('form')
        .send({ tag_ids: [tag._id.toString()], csrf_token: token });

      expect(res.status).toBe(302);

      const updated = await Expense.findById(expense._id);
      expect(updated.tags.length).toBe(1);
      expect(updated.tags[0].toString()).toBe(tag._id.toString());
    });
  });
});
