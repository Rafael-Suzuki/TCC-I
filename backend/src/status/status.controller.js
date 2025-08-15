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
const { StatusService } = require('./status.service');
const { JwtAuthGuard } = require('../auth/guards/jwt-auth.guard');
const { RolesGuard } = require('../auth/guards/roles.guard');
const { Roles } = require('../auth/decorators/roles.decorator');
const { CreateStatusDto } = require('./dto/create-status.dto');
const { UpdateStatusDto } = require('./dto/update-status.dto');

/**
 * Controller de status dos bairros
 * Gerencia o status de fornecimento de água por bairro
 */
const StatusController = Controller('status')(class StatusController {
  constructor(statusService) {
    this.statusService = statusService;
  }

  /**
   * Listar todos os status (rota pública)
   * GET /api/status
   */
  async findAll(query) {
    try {
      const { search, status } = query;
      const statusList = await this.statusService.findAll({ search, status });
      
      return {
        success: true,
        message: 'Status listados com sucesso',
        data: statusList,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao listar status',
        error: error.message,
      };
    }
  }

  /**
   * Buscar status por ID
   * GET /api/status/:id
   */
  async findOne(id) {
    try {
      const status = await this.statusService.findOne(parseInt(id));
      return {
        success: true,
        message: 'Status encontrado com sucesso',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar status',
        error: error.message,
      };
    }
  }

  /**
   * Buscar status por nome do bairro
   * GET /api/status/bairro/:nome
   */
  async findByNeighborhood(nome) {
    try {
      const status = await this.statusService.findByNeighborhood(nome);
      return {
        success: true,
        message: 'Status do bairro encontrado com sucesso',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar status do bairro',
        error: error.message,
      };
    }
  }

  /**
   * Criar novo status (usuários e administradores)
   * POST /api/status
   */
  async create(createStatusDto) {
    try {
      const status = await this.statusService.create(createStatusDto);
      return {
        success: true,
        message: 'Status criado com sucesso',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao criar status',
        error: error.message,
      };
    }
  }

  /**
   * Atualizar status (usuários e administradores)
   * PUT /api/status/:id
   */
  async update(id, updateStatusDto) {
    try {
      const status = await this.statusService.update(parseInt(id), updateStatusDto);
      return {
        success: true,
        message: 'Status atualizado com sucesso',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar status',
        error: error.message,
      };
    }
  }

  /**
   * Deletar status (usuários e administradores)
   * DELETE /api/status/:id
   */
  async remove(id) {
    try {
      await this.statusService.remove(parseInt(id));
      return {
        success: true,
        message: 'Status deletado com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao deletar status',
        error: error.message,
      };
    }
  }

  /**
   * Obter estatísticas dos status
   * GET /api/status/stats/overview
   */
  async getStats() {
    try {
      const stats = await this.statusService.getStats();
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

  /**
   * Atualizar status em lote
   * PUT /api/status/batch
   */
  async batchUpdate(batchUpdateDto) {
    try {
      const result = await this.statusService.batchUpdate(batchUpdateDto);
      return {
        success: true,
        message: 'Status atualizados em lote com sucesso',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar status em lote',
        error: error.message,
      };
    }
  }

  /**
   * Atualizar coordenadas de um bairro (apenas operadores e administradores)
   * PUT /api/status/:id/coords
   */
  async updateCoords(id, coordsDto, req) {
    try {
      const { latitude, longitude } = coordsDto;
      const userId = req.user?.id || null;
      
      const result = await this.statusService.updateCoords(parseInt(id), {
        latitude,
        longitude,
        userId,
      });
      
      return {
        success: true,
        message: 'Coordenadas atualizadas com sucesso',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar coordenadas',
        error: error.message,
      };
    }
  }
});

// Aplicar decorators aos métodos
Get()(StatusController.prototype.findAll);
Get(':id')(StatusController.prototype.findOne);
Get('bairro/:nome')(StatusController.prototype.findByNeighborhood);
Post()(StatusController.prototype.create);
HttpCode(HttpStatus.CREATED)(StatusController.prototype.create);
UseGuards(JwtAuthGuard, RolesGuard)(StatusController.prototype.create);
Roles('admin', 'user')(StatusController.prototype.create);
Put(':id')(StatusController.prototype.update);
UseGuards(JwtAuthGuard, RolesGuard)(StatusController.prototype.update);
Roles('admin', 'user')(StatusController.prototype.update);
Delete(':id')(StatusController.prototype.remove);
HttpCode(HttpStatus.NO_CONTENT)(StatusController.prototype.remove);
UseGuards(JwtAuthGuard, RolesGuard)(StatusController.prototype.remove);
Roles('admin', 'user')(StatusController.prototype.remove);
Get('stats/overview')(StatusController.prototype.getStats);
Put('batch/update')(StatusController.prototype.batchUpdate);
UseGuards(JwtAuthGuard, RolesGuard)(StatusController.prototype.batchUpdate);
Roles('admin', 'user')(StatusController.prototype.batchUpdate);
Put(':id/coords')(StatusController.prototype.updateCoords);
UseGuards(JwtAuthGuard, RolesGuard)(StatusController.prototype.updateCoords);
Roles('admin', 'operator')(StatusController.prototype.updateCoords);

module.exports = { StatusController };