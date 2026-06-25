import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // In production, restrict origin to frontend URL
app.use(express.json());

// API Router
app.use('/api', router);

// Global Error Handler for unhandled exceptions
app.use((err, req, res, next) => {
  console.error('System Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.'
  });
});

app.listen(PORT, () => {
  console.log(`NGO LMS API running on port ${PORT}`);
});
