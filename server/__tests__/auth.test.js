const request = require('supertest');
const app = require('../index');
const { initDatabase } = require('../database/init');

describe('Authentication API', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  describe('POST /api/auth/setup-admin', () => {
    it('should create default admin user', async () => {
      const response = await request(app).post('/api/auth/setup-admin').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.credentials).toHaveProperty('username', 'admin');
    });

    it('should not create admin if one already exists', async () => {
      const response = await request(app).post('/api/auth/setup-admin').expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'admin');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test1234!',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'viewer',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          password: 'weak',
          email: 'test2@example.com',
          full_name: 'Test User 2',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test1234!',
          email: 'another@example.com',
          full_name: 'Another User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
