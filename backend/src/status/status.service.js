const { Op } = require('sequelize');
const { createNeighborhoodStatusModel } = require('../models/neighborhood-status.model');
const { database } = require('../database/database');

/**
 * Service de status dos bairros
 * Contém toda a lógica de negócio para gerenciamento de status
 */
class StatusService {
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
      throw new Error(`Status com ID ${id} não encontrado`);
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
      throw new Error(`Status do bairro '${bairro}' não encontrado`);
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
      throw new Error(`Já existe status cadastrado para o bairro '${bairro}'`);
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
   * @param {number} userId - ID do usuário que está fazendo a alteração
   * @returns {Promise<NeighborhoodStatus>} - Status atualizado
   */
  async update(id, updateStatusDto, userId = null) {
    const status = await this.neighborhoodStatusModel.findByPk(id);

    if (!status) {
      throw new Error(`Status com ID ${id} não encontrado`);
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
        throw new Error(`Já existe status cadastrado para o bairro '${updateStatusDto.bairro}'`);
      }
    }

    // Registrar histórico se o status está sendo alterado
    if (updateStatusDto.status && updateStatusDto.status !== status.status) {
      await this.recordStatusHistory({
        neighborhood_id: id,
        status: updateStatusDto.status,
        changed_by: userId,
        source: 'manual',
        notes: `Status alterado de '${status.status}' para '${updateStatusDto.status}'`
      });
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
      throw new Error(`Status com ID ${id} não encontrado`);
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
   * Atualizar coordenadas de um bairro
   * @param {number} id - ID do status
   * @param {Object} coordsData - Dados das coordenadas
   * @param {number} coordsData.latitude - Latitude (-90 a 90)
   * @param {number} coordsData.longitude - Longitude (-180 a 180)
   * @param {number} coordsData.userId - ID do usuário que está fazendo a alteração
   * @returns {Promise<Object>} - Status atualizado com coordenadas
   */
  async updateCoords(id, { latitude, longitude, userId }) {
    // Inicializa o modelo se necessário
    this.initializeModel();
    
    if (!this.neighborhoodStatusModel) {
      throw new Error('Modelo NeighborhoodStatus não inicializado');
    }

    // Validar coordenadas
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90 graus');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180 graus');
    }

    // Buscar o status
    const status = await this.neighborhoodStatusModel.findByPk(id);

    if (!status) {
      throw new Error(`Status com ID ${id} não encontrado`);
    }

    // Atualizar coordenadas
    await status.update({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });

    return {
      id: status.id,
      bairro: status.bairro,
      status: status.status,
      latitude: status.latitude,
      longitude: status.longitude,
      updated_at: status.updatedAt,
    };
  }

  /**
   * Obter mapa de cores para o frontend
   * @returns {Object} - Mapa de cores por status
   */
  getStatusColorMap() {
    return {
      normal: '#3B82F6', // blue-500
      intermitente: '#F97316', // orange-500
      falta: '#EF4444', // red-500
      sem_informacao: '#9CA3AF' // gray-400
    };
  }

  /**
   * Registrar mudança de status no histórico
   * @param {Object} historyData - Dados do histórico
   * @returns {Promise<void>}
   */
  async recordStatusHistory(historyData) {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      console.warn('Banco de dados não disponível para registrar histórico');
      return;
    }

    try {
      await sequelize.query(
        `INSERT INTO status_history (neighborhood_id, status, changed_at, changed_by, source, notes) 
         VALUES (:neighborhood_id, :status, NOW(), :changed_by, :source, :notes)`,
        {
          replacements: {
            neighborhood_id: historyData.neighborhood_id,
            status: historyData.status,
            changed_by: historyData.changed_by,
            source: historyData.source || 'manual',
            notes: historyData.notes
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
    } catch (error) {
      console.error('Erro ao registrar histórico de status:', error);
      // Não falha a operação principal se o histórico falhar
    }
  }

  /**
   * Buscar histórico de status por período
   * @param {Object} options - Opções de busca
   * @param {string} options.from - Data inicial (ISO string)
   * @param {string} options.to - Data final (ISO string)
   * @param {number} options.neighborhoodId - ID do bairro (opcional)
   * @returns {Promise<Array>} - Histórico de mudanças
   */
  async getStatusHistory(options = {}) {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      throw new Error('Banco de dados não disponível');
    }

    const { from, to, neighborhoodId } = options;
    
    // Definir período padrão (últimos 30 dias)
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    let whereClause = 'WHERE sh.changed_at BETWEEN :fromDate AND :toDate';
    const replacements = { fromDate, toDate };

    if (neighborhoodId) {
      whereClause += ' AND sh.neighborhood_id = :neighborhoodId';
      replacements.neighborhoodId = neighborhoodId;
    }

    const query = `
      SELECT 
        sh.id,
        sh.neighborhood_id,
        ns.bairro as neighborhood_name,
        sh.status,
        sh.changed_at,
        sh.changed_by,
        sh.source,
        sh.notes
      FROM status_history sh
      LEFT JOIN neighborhood_status ns ON sh.neighborhood_id = ns.id
      ${whereClause}
      ORDER BY sh.changed_at DESC
    `;

    try {
      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      return results;
    } catch (error) {
      console.error('Erro ao buscar histórico de status:', error);
      throw new Error('Erro ao buscar histórico de status');
    }
  }

  /**
   * Obter estatísticas de incidentes por período
   * @param {Object} options - Opções de busca
   * @param {string} options.from - Data inicial (ISO string)
   * @param {string} options.to - Data final (ISO string)
   * @returns {Promise<Object>} - Estatísticas de incidentes
   */
  async getIncidentStats(options = {}) {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      throw new Error('Banco de dados não disponível');
    }

    const { from, to } = options;
    
    // Definir período padrão (últimos 30 dias)
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const query = `
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(DISTINCT neighborhood_id) as affected_neighborhoods,
        status,
        COUNT(*) as count_by_status
      FROM status_history 
      WHERE changed_at BETWEEN :fromDate AND :toDate
        AND status IN ('intermitente', 'falta')
      GROUP BY status
    `;

    try {
      const results = await sequelize.query(query, {
        replacements: { fromDate, toDate },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        period: { from: fromDate, to: toDate },
        incidents: results
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de incidentes:', error);
      throw new Error('Erro ao buscar estatísticas de incidentes');
    }
  }
}

module.exports = { StatusService };