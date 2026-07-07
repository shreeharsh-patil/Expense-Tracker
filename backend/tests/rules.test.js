const request = require('supertest');
const mongoose = require('mongoose');

const { SmartRule, Tag, Expense } = require('../models');
const { createTestApp, createAuthenticatedAgent, createTestTag, testErrorHandler } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const rulesRouter = require('../routes/rules');
const { apply_smart_rules } = require('../routes/rules');

describe('Rules Routes', () => {
  let app;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  afterEach(async () => { await clearTestDb(); });
  beforeEach(() => { app = createTestApp(); });

  describe('GET /rules', () => {
    it('should render the rules page when authenticated', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/rules');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Smart Rules');
    });

    it('should display created rules', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      await new SmartRule({
        user_id: user._id, name: 'Zomato Rule',
        pattern: 'zomato|swiggy', category: 'Food', is_active: true
      }).save();

      const res = await agent.get('/rules');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Zomato Rule');
      expect(res.text).toContain('Food');
    });

    it('should show empty state when no rules', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/rules');
      expect(res.status).toBe(200);
      expect(res.text).toContain('No Rules Yet');
    });

    it('should redirect to login when not authenticated', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const res = await request(app).get('/rules');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /rules/add', () => {
    it('should create a new rule', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/rules/add')
        .type('form')
        .send({
          name: 'Food Delivery',
          pattern: 'zomato|swiggy',
          category: 'Food',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/rules');

      const rule = await SmartRule.findOne({ name: 'Food Delivery' });
      expect(rule).toBeTruthy();
      expect(rule.pattern).toBe('zomato|swiggy');
      expect(rule.category).toBe('Food');
    });

    it('should reject rule without name or pattern', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent } = await createAuthenticatedAgent(app);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/rules/add')
        .type('form')
        .send({ name: '', pattern: '', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/rules');
    });

    it('should create rule with tag associations', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);
      const tag = await createTestTag(user._id);

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/rules/add')
        .type('form')
        .send({
          name: 'Tax Rule',
          pattern: 'invoice|consulting',
          tag_ids: [tag._id.toString()],
          csrf_token: token
        });

      expect(res.status).toBe(302);

      const rule = await SmartRule.findOne({ name: 'Tax Rule' });
      expect(rule.tags).toContain(tag._id.toString());
    });
  });

  describe('POST /rules/:id/toggle', () => {
    it('should toggle rule active state', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const rule = await new SmartRule({
        user_id: user._id, name: 'Toggle Rule',
        pattern: 'test', is_active: true
      }).save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      await agent.post(`/rules/${rule._id}/toggle`)
        .type('form')
        .send({ csrf_token: token });

      const toggled = await SmartRule.findById(rule._id);
      expect(toggled.is_active).toBe(false);

      await agent.post(`/rules/${rule._id}/toggle`)
        .type('form')
        .send({ csrf_token: token });

      const toggledAgain = await SmartRule.findById(rule._id);
      expect(toggledAgain.is_active).toBe(true);
    });
  });

  describe('POST /rules/:id/delete', () => {
    it('should delete a rule', async () => {
      app.use('/', rulesRouter);
      app.use(testErrorHandler);
      const { agent, user } = await createAuthenticatedAgent(app);

      const rule = await new SmartRule({
        user_id: user._id, name: 'Delete Rule',
        pattern: 'delete', is_active: true
      }).save();

      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post(`/rules/${rule._id}/delete`)
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/rules');

      const deleted = await SmartRule.findById(rule._id);
      expect(deleted).toBeNull();
    });
  });

  // ------------------------------------------------------------------ //
  // apply_smart_rules unit tests
  // ------------------------------------------------------------------ //
  describe('apply_smart_rules()', () => {
    it('should auto-categorize based on description pattern', async () => {
      const { user } = await createAuthenticatedAgent(app);

      await new SmartRule({
        user_id: user._id, name: 'Zomato',
        pattern: 'zomato', category: 'Food', is_active: true
      }).save();

      const result = await apply_smart_rules(
        user._id.toString(),
        'Order from Zomato - lunch special',
        null,
        []
      );

      expect(result.category).toBe('Food');
    });

    it('should return unchanged if no rules match', async () => {
      const { user } = await createAuthenticatedAgent(app);

      const result = await apply_smart_rules(
        user._id.toString(),
        'Random expense',
        'Shopping',
        []
      );

      expect(result.category).toBe('Shopping');
    });

    it('should apply tags from matching rules', async () => {
      const { user } = await createAuthenticatedAgent(app);
      const tag = await createTestTag(user._id);

      await new SmartRule({
        user_id: user._id, name: 'Work Expense',
        pattern: 'project|client',
        category: 'Freelance',
        tags: tag._id.toString(),
        is_active: true
      }).save();

      const result = await apply_smart_rules(
        user._id.toString(),
        'Client project payment',
        'Other',
        []
      );

      expect(result.category).toBe('Freelance');
      expect(result.tag_ids).toContain(tag._id.toString());
    });

    it('should only apply the highest priority matching rule', async () => {
      const { user } = await createAuthenticatedAgent(app);

      await new SmartRule({
        user_id: user._id, name: 'Low Priority',
        pattern: 'uber', category: 'Transport', priority: 1, is_active: true
      }).save();
      await new SmartRule({
        user_id: user._id, name: 'High Priority',
        pattern: 'uber', category: 'Food', priority: 10, is_active: true
      }).save();

      const result = await apply_smart_rules(
        user._id.toString(),
        'uber eats delivery',
        'Other',
        []
      );

      expect(result.category).toBe('Food');
    });

    it('should ignore inactive rules', async () => {
      const { user } = await createAuthenticatedAgent(app);

      await new SmartRule({
        user_id: user._id, name: 'Inactive',
        pattern: 'netflix', category: 'Entertainment', is_active: false
      }).save();

      const result = await apply_smart_rules(
        user._id.toString(),
        'netflix monthly',
        'Bills',
        []
      );

      expect(result.category).toBe('Bills');
    });
  });
});
