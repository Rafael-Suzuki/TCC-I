const { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } = require('@nestjs/common');
const { AuthService } = require('./auth.service');
const { LocalAuthGuard } = require('./guards/local-auth.guard');
const { JwtAuthGuard } = require('./guards/jwt-auth.guard');
const { RolesGuard } = require('./guards/roles.guard');
const { Roles } = require('./decorators/roles.decorator');
const { LoginDto } = require('./dto/login.dto');
const { RegisterDto } = require('./dto/register.dto');

/**
 * Controller de autenticação
 * Gerencia login, registro e validação de usuários
 */
const AuthController = Controller('auth')(class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * Endpoint de login
   * POST /api/auth/login
   */
  async login(req, loginDto) {
    try {
      const result = await this.authService.login(req.user);
      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao realizar login',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint de registro (apenas admins)
   * POST /api/auth/register
   */
  async register(registerDto) {
    try {
      const user = await this.authService.register(registerDto);
      return {
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao criar usuário',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint de validação de token
   * POST /api/auth/validate
   */
  async validateToken(req) {
    return {
      success: true,
      message: 'Token válido',
      data: {
        user: req.user,
        isAuthenticated: true,
      },
    };
  }

  /**
   * Endpoint para obter perfil do usuário
   * POST /api/auth/profile
   */
  async getProfile(req) {
    try {
      const user = await this.authService.findUserById(req.user.id);
      return {
        success: true,
        message: 'Perfil obtido com sucesso',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao obter perfil',
        error: error.message,
      };
    }
  }
});

// Aplicar decorators aos métodos
UseGuards(LocalAuthGuard)(AuthController.prototype, 'login');
Post('login')(AuthController.prototype, 'login');
HttpCode(HttpStatus.OK)(AuthController.prototype, 'login');

UseGuards(JwtAuthGuard, RolesGuard)(AuthController.prototype, 'register');
Roles('admin')(AuthController.prototype, 'register');
Post('register')(AuthController.prototype, 'register');
HttpCode(HttpStatus.CREATED)(AuthController.prototype, 'register');

UseGuards(JwtAuthGuard)(AuthController.prototype, 'validateToken');
Post('validate')(AuthController.prototype, 'validateToken');
HttpCode(HttpStatus.OK)(AuthController.prototype, 'validateToken');

UseGuards(JwtAuthGuard)(AuthController.prototype, 'getProfile');
Post('profile')(AuthController.prototype, 'getProfile');
HttpCode(HttpStatus.OK)(AuthController.prototype, 'getProfile');

module.exports = { AuthController };