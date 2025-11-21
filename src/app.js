require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Import routes and database
const { initializeDatabase } = require('./utils/database');
const linkRoutes = require('./routes/links');
const healthRoutes = require('./routes/health');
const { redirectLink } = require('./controllers/linkController');
const { redirectLimiter, createLinkLimiter } = require('./middleware/rateLimit');

// Health check route
app.use('/healthz', healthRoutes);

// API routes
app.use('/api/links', createLinkLimiter, linkRoutes);

// Redirect route - must come before the general 404 handler
app.get('/:code', redirectLimiter, redirectLink);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    message: 'The requested endpoint does not exist'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('Starting TinyLink backend server...');
    
    // Initialize database
    await initializeDatabase();
    console.log(' Database connected successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log('TinyLink Backend Server Started!');
      console.log(`Port: ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/healthz`);
      console.log(`Base URL: ${process.env.BASE_URL || 'http://localhost:3001'}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Server is ready to accept requests');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();