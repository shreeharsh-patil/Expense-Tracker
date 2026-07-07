const request = require('supertest');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { User, EmailOtp } = require('../models');
const { createTestApp, createTestUser, createAuthenticatedAgent } = require('./helpers');
const { connectTestDb, disconnectTestDb, clearTestDb } = require('./db');

const authRouter = require('../routes/auth');

describe('Auth Routes', () => {
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
    app.use('/', authRouter);
  });

  // ------------------------------------------------------------------ //
  // GET /login
  // ------------------------------------------------------------------ //
  describe('GET /login', () => {
    it('should render the login page', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Welcome back');
    });

    it('should redirect to dashboard if already logged in', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/login');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /login (form-based via agent to maintain session)
  // ------------------------------------------------------------------ //
  describe('POST /login (form-based)', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser({ email: 'login-test@example.com' });
      const agent = request.agent(app);
      await agent.get('/login');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/login')
        .type('form')
        .send({
          email: 'login-test@example.com',
          password: 'testpass123',
          csrf_token: token
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });

    it('should return error with invalid credentials', async () => {
      await createTestUser({ email: 'wrong@example.com' });
      const agent = request.agent(app);
      await agent.get('/login');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/login')
        .type('form')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
          csrf_token: token
        });

      expect(res.status).toBe(200); // Re-renders login page with error
      expect(res.text).toContain('Welcome back');
    });

    it('should require email and password', async () => {
      const agent = request.agent(app);
      await agent.get('/login');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/login')
        .type('form')
        .send({ email: '', password: '', csrf_token: token });

      expect(res.status).toBe(200); // Re-renders login page
    });
  });

  // ------------------------------------------------------------------ //
  // GET /register
  // ------------------------------------------------------------------ //
  describe('GET /register', () => {
    it('should render the registration page', async () => {
      const res = await request(app).get('/register');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Create your account');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /register - initial step
  // ------------------------------------------------------------------ //
  describe('POST /register - initial step', () => {
    it('should validate name length', async () => {
      const agent = request.agent(app);
      await agent.get('/register');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/register')
        .type('form')
        .send({
          name: 'A',
          email: 'new@example.com',
          password: 'password123',
          confirm_password: 'password123',
          csrf_token: token
        });

      expect(res.status).toBe(200);
    });

    it('should create pending registration and send OTP', async () => {
      const agent = request.agent(app);
      await agent.get('/register');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/register')
        .type('form')
        .send({
          name: 'New User',
          email: 'fresh@example.com',
          password: 'password123',
          confirm_password: 'password123',
          csrf_token: token
        });

      // Should re-render with OTP form
      expect(res.status).toBe(200);
      expect(res.text).toContain('Check your email');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /register - OTP verification
  // ------------------------------------------------------------------ //
  describe('POST /register - OTP verification', () => {
    it('should handle valid OTP submission and create user', async () => {
      const agent = request.agent(app);
      await agent.get('/register');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      // Submit registration to set up pending_registration in session
      await agent.post('/register')
        .type('form')
        .send({
          name: 'OTP User',
          email: 'otp-test@example.com',
          password: 'testpass123',
          confirm_password: 'testpass123',
          csrf_token: token
        });

      // Create an OTP entry in DB matching what the route would create
      const otpEntry = new EmailOtp({
        email: 'otp-test@example.com',
        otp: '123456',
        name: 'OTP User',
        password_hash: '$2a$10$dummyhashfordevelopmenttesting',
        expires_at: new Date(Date.now() + 600000),
        used: false
      });
      await otpEntry.save();

      // Get fresh CSRF token
      const csrfRes2 = await agent.get('/api/auth/csrf-token');
      const token2 = csrfRes2.body.csrfToken;

      // Submit OTP
      const otpRes = await agent.post('/register')
        .type('form')
        .send({ otp_code: '123456', csrf_token: token2 });

      expect(otpRes.status).toBe(302);
      expect(otpRes.headers.location).toBe('/dashboard');

      const user = await User.findOne({ email: 'otp-test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('OTP User');
    });

    it('should reject invalid OTP code', async () => {
      const agent = request.agent(app);
      await agent.get('/register');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      // Submit registration
      await agent.post('/register')
        .type('form')
        .send({
          name: 'OTP Bad',
          email: 'otp-bad@example.com',
          password: 'testpass123',
          confirm_password: 'testpass123',
          csrf_token: token
        });

      // Fresh token for OTP submission
      const csrfRes2 = await agent.get('/api/auth/csrf-token');
      const token2 = csrfRes2.body.csrfToken;

      const otpRes = await agent.post('/register')
        .type('form')
        .send({ otp_code: '000000', csrf_token: token2 });

      expect(otpRes.status).toBe(200);
    });
  });

  // ------------------------------------------------------------------ //
  // POST /resend-otp
  // ------------------------------------------------------------------ //
  describe('POST /resend-otp', () => {
    it('should redirect to register when no pending registration', async () => {
      const agent = request.agent(app);
      await agent.get('/register');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/resend-otp')
        .type('form')
        .send({ csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/register');
    });
  });

  // ------------------------------------------------------------------ //
  // GET /logout
  // ------------------------------------------------------------------ //
  describe('GET /logout', () => {
    it('should destroy session and redirect to home', async () => {
      const res = await request(app).get('/logout');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');
    });
  });

  // ------------------------------------------------------------------ //
  // GET /forgot-password
  // ------------------------------------------------------------------ //
  describe('GET /forgot-password', () => {
    it('should render forgot password page', async () => {
      const res = await request(app).get('/forgot-password');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Vault Recovery');
    });
  });

  // ------------------------------------------------------------------ //
  // POST /forgot-password
  // ------------------------------------------------------------------ //
  describe('POST /forgot-password', () => {
    it('should send reset link for registered email', async () => {
      await createTestUser({ email: 'reset-me@example.com' });
      const agent = request.agent(app);
      await agent.get('/forgot-password');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/forgot-password')
        .type('form')
        .send({ email: 'reset-me@example.com', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should not reveal if email is not registered', async () => {
      const agent = request.agent(app);
      await agent.get('/forgot-password');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/forgot-password')
        .type('form')
        .send({ email: 'nonexistent@example.com', csrf_token: token });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  // ------------------------------------------------------------------ //
  // API Endpoints
  // ------------------------------------------------------------------ //
  describe('GET /api/auth/me', () => {
    it('should return null for unauthenticated user', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('should return user data for authenticated user', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeTruthy();
      expect(res.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return success', async () => {
      const { agent, csrfToken } = await createAuthenticatedAgent(app);

      const res = await agent.post('/api/auth/logout')
        .send({ csrf_token: csrfToken });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing email/password', async () => {
      const agent = request.agent(app);
      await agent.get('/login');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/api/auth/login')
        .send({ csrf_token: token });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 401 for invalid credentials', async () => {
      await createTestUser({ email: 'api-test@example.com' });
      const agent = request.agent(app);
      await agent.get('/login');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/api/auth/login')
        .send({ email: 'api-test@example.com', password: 'wrongpass', csrf_token: token });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });

    it('should login successfully with correct credentials', async () => {
      await createTestUser({ email: 'api-valid@example.com' });
      const agent = request.agent(app);
      await agent.get('/login');
      const csrfRes = await agent.get('/api/auth/csrf-token');
      const token = csrfRes.body.csrfToken;

      const res = await agent.post('/api/auth/login')
        .send({ email: 'api-valid@example.com', password: 'testpass123', csrf_token: token });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('api-valid@example.com');
    });
  });
});
