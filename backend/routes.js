import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-ngo-dev-key';

// ==========================================
// MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'NGOAdmin') return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  next();
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, rows[0].password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role, org: rows[0].organization_id }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.json({ token, user: { id: rows[0].id, name: rows[0].full_name, role: rows[0].role } });
  } catch (err) { next(err); }
});

router.post('/auth/register', async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, role`,
      [email, hash, full_name]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists.' });
    next(err);
  }
});

// ==========================================
// ADMIN ROUTES (NGOAdmin Only)
// ==========================================
router.post('/admin/courses', [authenticate, requireAdmin], async (req, res, next) => {
  try {
    const { title, description, estimated_hours } = req.body;
    const { rows } = await query(
      `INSERT INTO courses (title, description, estimated_hours, created_by, organization_id, is_published) 
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [title, description, estimated_hours, req.user.id, req.user.org]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/admin/stats', [authenticate, requireAdmin], async (req, res, next) => {
  try {
    const usersCount = await query('SELECT COUNT(*) FROM users');
    const coursesCount = await query('SELECT COUNT(*) FROM courses');
    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalCourses: parseInt(coursesCount.rows[0].count)
    });
  } catch (err) { next(err); }
});

// ==========================================
// LEARNER ROUTES
// ==========================================
// Get all available published courses
router.get('/courses', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT id, title, description, estimated_hours FROM courses WHERE is_published = true`);
    res.json(rows);
  } catch (err) { next(err); }
});

// Enroll user in a course
router.post('/enrollments', authenticate, async (req, res, next) => {
  try {
    const { course_id } = req.body;
    const { rows } = await query(
      `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *`,
      [req.user.id, course_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Already enrolled in this course.' });
    next(err);
  }
});

// Get user's active enrollments
router.get('/enrollments', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.id as enrollment_id, e.progress_percentage, e.status, c.title, c.description 
       FROM enrollments e 
       JOIN courses c ON e.course_id = c.id 
       WHERE e.user_id = $1`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
