const { Injectable } = require('@nestjs/common');

/**
 * Service principal da aplicação
 * Contém lógica de negócio para endpoints básicos
 */
const AppService = Injectable()(class AppService {
  /**
   * Retorna mensagem de boas-vindas da API
   */
  getHello() {
    return {
      message: 'Sistema de Monitoramento de Água - João Monlevade API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retorna informações detalhadas da API
   */
  getApiInfo() {
    return {
      name: 'Water Monitoring API',
      description: 'API para monitoramento do fornecimento de água em João Monlevade - MG',
      version: '1.0.0',
      author: 'TCC-I',
      endpoints: {
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register (admin only)',
        },
        status: {
          list: 'GET /api/status',
          create: 'POST /api/status',
          update: 'PUT /api/status/:id',
          delete: 'DELETE /api/status/:id',
        },
        users: {
          list: 'GET /api/users (admin only)',
          create: 'POST /api/users (admin only)',
          update: 'PUT /api/users/:id (admin only)',
          delete: 'DELETE /api/users/:id (admin only)',
        },
      },
      documentation: 'Consulte o README.md para mais informações',
    };
  }

  /**
   * Retorna status de saúde do sistema
   */
  getHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    };
  }
});

module.exports = { AppService };