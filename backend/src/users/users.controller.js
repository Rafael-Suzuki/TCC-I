const {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} = require('@nestjs/common');
const { UsersService } = require('./users.service');
const { JwtAuthGuard } = require('../auth/guards/jwt-auth.guard');
const { RolesGuard } = require('../auth/guards/roles.guard');
const { Roles } = require('../auth/decorators/roles.decorator');
const { CreateUserDto } = require('./dto/create-user.dto');
const { UpdateUserDto } = require('./dto/update-user.dto');

/**
 * Controller de usuários
 * CRUD completo para gerenciamento de usuários (apenas administradores)
 */
const UsersController = Controller('users')(class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  /**
   * Listar todos os usuários
   * GET /api/users
   */
  async findAll(query) {
    try {
      const { page = 1, limit = 10, search } = query;
      const users = await this.usersService.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
      });
      
      return {
        success: true,
        message: 'Usuários listados com sucesso',
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao listar usuários',
        error: error.message,
      };
    }
  }

  /**
   * Buscar usuário por ID
   * GET /api/users/:id
   */
  async findOne(id) {
    try {
      const user = await this.usersService.findOne(parseInt(id));
      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar usuário',
        error: error.message,
      };
    }
  }

  /**
   * Criar novo usuário
   * POST /api/users
   */
  async create(createUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        success: true,
        message: 'Usuário criado com sucesso',
        data: user,
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
   * Atualizar usuário
   * PUT /api/users/:id
   */
  async update(id, updateUserDto) {
    try {
      const user = await this.usersService.update(parseInt(id), updateUserDto);
      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar usuário',
        error: error.message,
      };
    }
  }

  /**
   * Deletar usuário
   * DELETE /api/users/:id
   */
  async remove(id) {
    try {
      await this.usersService.remove(parseInt(id));
      return {
        success: true,
        message: 'Usuário deletado com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao deletar usuário',
        error: error.message,
      };
    }
  }

  /**
   * Obter estatísticas de usuários
   * GET /api/users/stats
   */
  async getStats() {
    try {
      const stats = await this.usersService.getStats();
      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message,
      };
    }
  }
});

// Aplicar decorators aos métodos
UseGuards(JwtAuthGuard, RolesGuard)(UsersController);
Roles('admin')(UsersController);
Get()(UsersController.prototype.findAll);
Get(':id')(UsersController.prototype.findOne);
Post()(UsersController.prototype.create);
HttpCode(HttpStatus.CREATED)(UsersController.prototype.create);
Put(':id')(UsersController.prototype.update);
Delete(':id')(UsersController.prototype.remove);
HttpCode(HttpStatus.NO_CONTENT)(UsersController.prototype.remove);
Get('stats/overview')(UsersController.prototype.getStats);

module.exports = { UsersController };