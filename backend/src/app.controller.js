const { Controller, Get } = require('@nestjs/common');
const { AppService } = require('./app.service');

/**
 * Controller principal da aplicação
 * Responsável por endpoints básicos de saúde e informações da API
 */
const AppController = Controller()(class AppController {
  constructor(appService) {
    this.appService = appService;
  }

  /**
   * Endpoint de saúde da aplicação
   * GET /api
   */
  getHello() {
    return this.appService.getHello();
  }

  /**
   * Informações detalhadas da API
   * GET /api/info
   */
  getInfo() {
    return this.appService.getInfo();
  }

  /**
   * Health check da aplicação
   * GET /api/health
   */
  getHealth() {
    return this.appService.getHealth();
  }
});

// Aplicar decorators aos métodos
Get()(AppController.prototype, 'getHello');
Get('info')(AppController.prototype, 'getInfo');
Get('health')(AppController.prototype, 'getHealth');

module.exports = { AppController };