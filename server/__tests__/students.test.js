const request = require('supertest');
const app = require('../index');
const { initDatabase } = require('../database/init');

let authToken;

describe('Students API', () => {
  beforeAll(async () => {
    await initDatabase();

    // Create admin and login
    await request(app).post('/api/auth/setup-admin');

    const loginResponse = await request(app).post('/api/auth/login').send({
      username: 'admin',
      password: 'admin123',
    });

    authToken = loginResponse.body.token;
  });

  describe('POST /api/students', () => {
    it('should create student with valid data', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({
          student_number: 'STU001',
          first_name: 'John',
          last_name: 'Doe',
          id_number: '9901015800083',
          email: 'john@example.com',
          phone: '0123456789',
          institution: 'Test University',
          campus: 'Main Campus',
          distance_from_campus_km: 25,
          nsfas_beneficiary: true,
          nsfas_reference: 'NSFAS12345',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('student_number', 'STU001');
      expect(response.body).toHaveProperty('eligible_for_accommodation', 1);
    });

    it('should mark student as ineligible if distance < 20km', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({
          student_number: 'STU002',
          first_name: 'Jane',
          last_name: 'Smith',
          id_number: '9802025900084',
          email: 'jane@example.com',
          phone: '0987654321',
          institution: 'Test University',
          campus: 'Main Campus',
          distance_from_campus_km: 15,
        })
        .expect(201);

      expect(response.body).toHaveProperty('eligible_for_accommodation', 0);
    });

    it('should reject duplicate student number', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({
          student_number: 'STU001',
          first_name: 'Duplicate',
          last_name: 'Student',
          id_number: '9903036100085',
          email: 'dup@example.com',
          phone: '0111111111',
          institution: 'Test University',
          campus: 'Main Campus',
          distance_from_campus_km: 25,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({
          student_number: 'STU003',
          first_name: 'Invalid',
          last_name: 'Email',
          id_number: '9904046200086',
          email: 'not-an-email',
          phone: '0222222222',
          institution: 'Test University',
          campus: 'Main Campus',
          distance_from_campus_km: 25,
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/students', () => {
    it('should get all students', async () => {
      const response = await request(app).get('/api/students').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter NSFAS beneficiaries', async () => {
      const response = await request(app).get('/api/students?nsfas_beneficiary=true').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((student) => {
        expect(student.nsfas_beneficiary).toBe(1);
      });
    });

    it('should filter eligible students', async () => {
      const response = await request(app).get('/api/students?eligible=true').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((student) => {
        expect(student.eligible_for_accommodation).toBe(1);
      });
    });
  });

  describe('GET /api/students/:id', () => {
    it('should get student by ID', async () => {
      const response = await request(app).get('/api/students/1').expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('student_number');
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app).get('/api/students/99999').expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
