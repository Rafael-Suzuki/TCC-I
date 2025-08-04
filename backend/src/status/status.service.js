const { Injectable, NotFoundException, ConflictException } = require('@nestjs/common');
const { InjectModel } = require('@nestjs/sequelize');
const { Op } = require('sequelize');
const { createNeighborhoodStatusModel } = require('../database/models/neighborhood-status.model');
const { database } = require('../database/database');

/**
 * Service de status dos bairros
 * Contém toda a lógica de negócio para gerenciamento de status
 */
const StatusService = Injectable()(class StatusService {
  constructor() {
    this.neighborhoodStatusModel = null;
    this.initializeModel();
  }

  /**
   * Inicializa o modelo NeighborhoodStatus se o banco estiver disponível
   */
  initializeModel() {
    const sequelize = database.getSequelize();
    if (sequelize && !this.neighborhoodStatusModel) {
      this.neighborhoodStatusModel = createNeighborhoodStatusModel(sequelize);
      database.registerModel('NeighborhoodStatus', this.neighborhoodStatusModel);
    }
  }

  /**
   * Listar todos os status com filtros
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} - Lista de status
   */
  async findAll(options = {}) {
    // Inicializa o modelo se necessário
    this.initializeModel();
    
    if (!this.neighborhoodStatusModel) {
      throw new Error('Modelo NeighborhoodStatus não inicializado');
    }
    
    const { search, status } = options;

    // Configurar filtros
    const whereClause = {};
    
    if (search) {
      whereClause.bairro = {
        [Op.iLike]: `%${search}%`,
      };
    }

    if (status) {
      whereClause.status = status;
    }

    // Buscar status
    const statusList = await this.neighborhoodStatusModel.findAll({
      where: whereClause,
      order: [['bairro', 'ASC']],
    });

    return statusList.map(item => item.toJSON());
  }

  /**
   * Buscar status por ID
   * @param {number} id - ID do status
   * @returns {Promise<NeighborhoodStatus>} - Status encontrado
   */
  async findOne(id) {
    // Inicializa o modelo se necessário
    this.initializeModel();
    
    if (!this.neighborhoodStatusModel) {
      throw new Error('Modelo NeighborhoodStatus não inicializado');
    }
    
    const status = await this.neighborhoodStatusModel.findByPk(id);

    if (!status) {
      throw new NotFoundException(`Status com ID ${id} não encontrado`);
    }

    return status.toJSON();
  }

  /**
   * Buscar status por nome do bairro
   * @param {string} bairro - Nome do bairro
   * @returns {Promise<NeighborhoodStatus>} - Status do bairro
   */
  async findByNeighborhood(bairro) {
    // Inicializa o modelo se necessário
    this.initializeModel();
    
    if (!this.neighborhoodStatusModel) {
      throw new Error('Modelo NeighborhoodStatus não inicializado');
    }
    
    const status = await this.neighborhoodStatusModel.findOne({
      where: {
        bairro: {
          [Op.iLike]: bairro,
        },
      },
    });

    if (!status) {
      throw new NotFoundException(`Status do bairro '${bairro}' não encontrado`);
    }

    return status.toJSON();
  }

  /**
   * Criar novo status
   * @param {CreateStatusDto} createStatusDto - Dados do status
   * @returns {Promise<NeighborhoodStatus>} - Status criado
   */
  async create(createStatusDto) {
    const { bairro, status } = createStatusDto;

    // Verificar se já existe status para este bairro
    const existingStatus = await this.neighborhoodStatusModel.findOne({
      where: {
        bairro: {
          [Op.iLike]: bairro,
        },
      },
    });

    if (existingStatus) {
      throw new ConflictException(`Já existe status cadastrado para o bairro '${bairro}'`);
    }

    // Criar o status
    const newStatus = await this.neighborhoodStatusModel.create({
      bairro,
      status: status || 'sem_info',
    });

    return newStatus.toJSON();
  }

  /**
   * Atualizar status
   * @param {number} id - ID do status
   * @param {UpdateStatusDto} updateStatusDto - Dados para atualização
   * @returns {Promise<NeighborhoodStatus>} - Status atualizado
   */
  async update(id, updateStatusDto) {
    const status = await this.neighborhoodStatusModel.findByPk(id);

    if (!status) {
      throw new NotFoundException(`Status com ID ${id} não encontrado`);
    }

    // Verificar se o bairro já existe (se estiver sendo alterado)
    if (updateStatusDto.bairro && updateStatusDto.bairro !== status.bairro) {
      const existingStatus = await this.neighborhoodStatusModel.findOne({
        where: {
          bairro: {
            [Op.iLike]: updateStatusDto.bairro,
          },
          id: { [Op.ne]: id },
        },
      });

      if (existingStatus) {
        throw new ConflictException(`Já existe status cadastrado para o bairro '${updateStatusDto.bairro}'`);
      }
    }

    // Atualizar o status
    await status.update(updateStatusDto);

    return status.toJSON();
  }

  /**
   * Deletar status
   * @param {number} id - ID do status
   * @returns {Promise<void>}
   */
  async remove(id) {
    const status = await this.neighborhoodStatusModel.findByPk(id);

    if (!status) {
      throw new NotFoundException(`Status com ID ${id} não encontrado`);
    }

    await status.destroy();
  }

  /**
   * Obter estatísticas dos status
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats() {
    const totalNeighborhoods = await this.neighborhoodStatusModel.count();
    
    const statusCounts = await this.neighborhoodStatusModel.findAll({
      attributes: [
        'status',
        [this.neighborhoodStatusModel.sequelize.fn('COUNT', this.neighborhoodStatusModel.sequelize.col('status')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // Organizar contadores por status
    const stats = {
      total: totalNeighborhoods,
      ok: 0,
      manutencao: 0,
      desabastecido: 0,
      sem_info: 0,
    };

    statusCounts.forEach(item => {
      stats[item.status] = parseInt(item.count);
    });

    // Calcular percentuais
    const percentages = {};
    Object.keys(stats).forEach(key => {
      if (key !== 'total') {
        percentages[key] = totalNeighborhoods > 0 
          ? Math.round((stats[key] / totalNeighborhoods) * 100)
          : 0;
      }
    });

    return {
      ...stats,
      percentages,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Atualizar status em lote
   * @param {Object} batchUpdateDto - Dados para atualização em lote
   * @returns {Promise<Object>} - Resultado da operação
   */
  async batchUpdate(batchUpdateDto) {
    const { updates } = batchUpdateDto; // Array de { id, status }
    
    const results = {
      success: [],
      errors: [],
    };

    for (const update of updates) {
      try {
        const status = await this.update(update.id, { status: update.status });
        results.success.push({
          id: update.id,
          bairro: status.bairro,
          newStatus: status.status,
        });
      } catch (error) {
        results.errors.push({
          id: update.id,
          error: error.message,
        });
      }
    }

    return {
      totalProcessed: updates.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      results,
    };
  }

  /**
   * Buscar bairros por status
   * @param {string} status - Status a buscar
   * @returns {Promise<Array>} - Lista de bairros com o status
   */
  async findByStatus(status) {
    const neighborhoods = await this.neighborhoodStatusModel.findAll({
      where: { status },
      order: [['bairro', 'ASC']],
    });

    return neighborhoods.map(item => item.toJSON());
  }

  /**
   * Obter mapa de cores para o frontend
   * @returns {Object} - Mapa de cores por status
   */
  getStatusColorMap() {
    return {
      ok: '#007bff',
      manutencao: '#ffc107',
      desabastecido: '#dc3545',
      sem_info: '#6c757d',
    };
  }
});

module.exports = { StatusService };