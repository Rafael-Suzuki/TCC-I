const express = require('express');
const cors = require('cors');
const { AppModule } = require('../backend/src/app.module');
const { AuthController } = require('../backend/src/auth/auth.controller');
const { StatusController } = require('../backend/src/status/status.controller');
const { UsersController } = require('../backend/src/users/users.controller');
const { AuthMiddleware } = require('../backend/src/middleware/auth.middleware');
const { ValidationPipe } = require('../backend/src/pipes/validation.pipe');
const { ResponseInterceptor } = require('../backend/src/interceptors/response.interceptor');
const { Database } = require('../backend/src/database/database');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://simapi.ong.br',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const database = new Database();
database.initialize().catch(console.error);

// Initialize controllers
const authController = new AuthController();
const statusController = new StatusController();
const usersController = new UsersController();

// Initialize middleware
const authMiddleware = new AuthMiddleware();
const validationPipe = new ValidationPipe();
const responseInterceptor = new ResponseInterceptor();

// Apply response interceptor
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    const interceptedData = responseInterceptor.intercept(data);
    originalSend.call(this, interceptedData);
  };
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.get('/api/auth/profile', (req, res, next) => authMiddleware.use(req, res, next), (req, res) => authController.getProfile(req, res));

// Status routes
app.get('/api/status', (req, res) => statusController.findAll(req, res));
app.get('/api/status/:id', (req, res) => statusController.findOne(req, res));
app.get('/api/status/neighborhood/:neighborhood', (req, res) => statusController.findByNeighborhood(req, res));

// Users routes (protected)
app.get('/api/users', (req, res, next) => authMiddleware.use(req, res, next), (req, res) => usersController.findAll(req, res));
app.get('/api/users/:id', (req, res, next) => authMiddleware.use(req, res, next), (req, res) => usersController.findOne(req, res));
app.post('/api/users', (req, res, next) => authMiddleware.use(req, res, next), (req, res) => usersController.create(req, res));
app.put('/api/users/:id', (req, res, next) => authMiddleware.use(req, res, next), (req, res) => usersController.update(req, res));
app.delete('/api/users/:id', (req, res, next) => authMiddleware.use(req, res, next), (req, res) => usersController.remove(req, res));

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

module.exports = app;