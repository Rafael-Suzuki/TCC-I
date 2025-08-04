const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery, projectSchemas, commonSchemas } = require('../pipes/validation.pipe');
const { database } = require('../database/database');
const { createNeighborhoodStatusModel } = require('../models/neighborhood-status.model');

/**
 * Controller de status dos bairros - Express Router
 * Gerencia operações CRUD de status de abastecimento de água
 */
const router = express.Router();

// Inicializar modelo (será feito quando o banco estiver conectado)
let NeighborhoodStatus = null;

/**
 * Inicializa o modelo NeighborhoodStatus se o banco estiver disponível
 */
function initializeStatusModel() {
  const sequelize = database.getSequelize();
  if (sequelize && !NeighborhoodStatus) {
    NeighborhoodStatus = createNeighborhoodStatusModel(sequelize);
    database.registerModel('NeighborhoodStatus', NeighborhoodStatus);
  }
}

/**
 * GET /api/status
 * Lista todos os status com paginação e filtros
 */
router.get('/', 
  validateQuery(Joi.object({
    ...commonSchemas.pagination.describe(),
    ...commonSchemas.search.describe(),
    status: Joi.string().valid('normal', 'intermitente', 'sem_agua', 'manutencao'),
    priority: Joi.string().valid('baixa', 'media', 'alta', 'critica'),
    isResolved: Joi.boolean(),
    neighborhood: Joi.string(),
  })),
  async (req, res) => {
    try {
      initializeStatusModel();

      // Se banco estiver desabilitado, retornar dados mock
      if (!NeighborhoodStatus) {
        const mockStatuses = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            neighborhood: 'Centro',
            status: 'normal',
            description: 'Abastecimento funcionando normalmente',
            priority: 'baixa',
            isResolved: true,
            reportedBy: '550e8400-e29b-41d4-a716-446655440001',
            estimatedRepairTime: null,
            resolvedAt: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-15T08:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            neighborhood: 'Vila Operária',
            status: 'intermitente',
            description: 'Abastecimento irregular nas últimas 24h',
            priority: 'media',
            isResolved: false,
            reportedBy: '550e8400-e29b-41d4-a716-446655440002',
            estimatedRepairTime: '2024-01-20T14:00:00Z',
            resolvedAt: null,
            createdAt: '2024-01-18T14:30:00Z',
            updatedAt: '2024-01-18T14:30:00Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            neighborhood: 'Bairro São José',
            status: 'sem_agua',
            description: 'Falta total de água devido a rompimento na rede',
            priority: 'critica',
            isResolved: false,
            reportedBy: '550e8400-e29b-41d4-a716-446655440003',
            estimatedRepairTime: '2024-01-19T16:00:00Z',
            resolvedAt: null,
            createdAt: '2024-01-18T09:15:00Z',
            updatedAt: '2024-01-18T09:15:00Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            neighborhood: 'Jardim Alvorada',
            status: 'manutencao',
            description: 'Manutenção programada na estação de tratamento',
            priority: 'alta',
            isResolved: false,
            reportedBy: '550e8400-e29b-41d4-a716-446655440001',
            estimatedRepairTime: '2024-01-19T12:00:00Z',
            resolvedAt: null,
            createdAt: '2024-01-18T06:00:00Z',
            updatedAt: '2024-01-18T06:00:00Z',
          },
        ];

        const { page = 1, limit = 10, q, status, priority, isResolved, neighborhood } = req.query;
        let filteredStatuses = [...mockStatuses];

        // Aplicar filtros
        if (q) {
          filteredStatuses = filteredStatuses.filter(item => 
            item.neighborhood.toLowerCase().includes(q.toLowerCase()) ||
            item.description.toLowerCase().includes(q.toLowerCase())
          );
        }
        if (neighborhood) {
          filteredStatuses = filteredStatuses.filter(item => 
            item.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
          );
        }
        if (status) {
          filteredStatuses = filteredStatuses.filter(item => item.status === status);
        }
        if (priority) {
          filteredStatuses = filteredStatuses.filter(item => item.priority === priority);
        }
        if (isResolved !== undefined) {
          filteredStatuses = filteredStatuses.filter(item => item.isResolved === (isResolved === 'true'));
        }

        // Paginação
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedStatuses = filteredStatuses.slice(startIndex, endIndex);

        return res.paginated(paginatedStatuses, {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredStatuses.length,
          totalPages: Math.ceil(filteredStatuses.length / limit),
        });
      }

      // Lógica real com banco de dados
      const { page = 1, limit = 10, q, status, priority, isResolved, neighborhood, sort = 'desc', sortBy = 'createdAt' } = req.query;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (isResolved !== undefined) whereClause.isResolved = isResolved === 'true';
      
      // Busca por texto
      if (q || neighborhood) {
        const { Op } = require('sequelize');
        const searchTerm = q || neighborhood;
        whereClause[Op.or] = [
          { bairro: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
        ];
      }

      const statuses = await NeighborhoodStatus.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [[sortBy, sort.toUpperCase()]],
      });

      res.paginated(statuses.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: statuses.count,
        totalPages: Math.ceil(statuses.count / limit),
      });
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      res.error('Erro ao buscar status dos bairros', 500);
    }
  }
);

/**
 * GET /api/status/summary
 * Retorna resumo dos status por categoria
 */
router.get('/summary', async (req, res) => {
  try {
    initializeStatusModel();

    // Se banco estiver desabilitado, retornar dados mock
    if (!NeighborhoodStatus) {
      const mockSummary = {
        normal: 15,
        intermitente: 3,
        sem_agua: 1,
        manutencao: 2,
        total: 21,
        unresolved: 6,
        critical: 1,
      };
      return res.success(mockSummary, 'Resumo dos status');
    }

    const summary = await NeighborhoodStatus.getStatusSummary();
    const totalUnresolved = await NeighborhoodStatus.count({ where: { isResolved: false } });
    const criticalIssues = await NeighborhoodStatus.count({ 
      where: { 
        priority: 'critica',
        isResolved: false 
      } 
    });

    const result = {
      ...summary,
      total: Object.values(summary).reduce((acc, count) => acc + count, 0),
      unresolved: totalUnresolved,
      critical: criticalIssues,
    };

    res.success(result, 'Resumo dos status');
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.error('Erro ao buscar resumo dos status', 500);
  }
});

/**
 * GET /api/status/:id
 * Busca um status específico por ID
 */
router.get('/:id',
  validateParams(commonSchemas.uuidParam),
  async (req, res) => {
    try {
      initializeStatusModel();
      const { id } = req.params;

      // Se banco estiver desabilitado, retornar dados mock
      if (!NeighborhoodStatus) {
        const mockStatus = {
          id,
          neighborhood: 'Bairro Mock',
          status: 'normal',
          description: 'Status mock para demonstração',
          priority: 'media',
          isResolved: true,
          reportedBy: '550e8400-e29b-41d4-a716-446655440001',
          estimatedRepairTime: null,
          resolvedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-15T08:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        };
        return res.success(mockStatus, 'Status encontrado');
      }

      const status = await NeighborhoodStatus.findByPk(id, {
        include: [
          {
            model: database.getModel('User'),
            as: 'reporter',
            attributes: ['id', 'name', 'email'],
            required: false,
          },
        ],
      });

      if (!status) {
        return res.error('Status não encontrado', 404);
      }

      res.success(status, 'Status encontrado');
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      res.error('Erro ao buscar status', 500);
    }
  }
);

/**
 * POST /api/status
 * Cria um novo relatório de status
 */
router.post('/',
  validateBody(projectSchemas.createNeighborhoodStatus),
  async (req, res) => {
    try {
      initializeStatusModel();
      const { bairro, status, description, priority, estimatedRepairTime } = req.body;
      const reportedBy = req.user?.id; // Vem do middleware de autenticação

      // Se banco estiver desabilitado, simular criação
      if (!NeighborhoodStatus) {
        const mockStatus = {
          id: '550e8400-e29b-41d4-a716-' + Date.now(),
          neighborhood,
          status,
          description,
          priority: priority || 'media',
          isResolved: false,
          reportedBy: reportedBy || '550e8400-e29b-41d4-a716-446655440001',
          estimatedRepairTime,
          resolvedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return res.status(201).success(mockStatus, 'Status criado com sucesso');
      }

      // Criar status
      const newStatus = await NeighborhoodStatus.createReport({
      bairro,
      status,
      description,
      priority,
      estimatedRepairTime,
      reportedBy: req.user?.id,
    });
      
      res.status(201).success(newStatus, 'Status criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar status:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.error('Dados inválidos', 422, error.errors);
      }
      
      res.error('Erro ao criar status', 500);
    }
  }
);

/**
 * PUT /api/status/:id
 * Atualiza um status existente
 */
router.put('/:id',
  validateParams(commonSchemas.uuidParam),
  validateBody(projectSchemas.updateNeighborhoodStatus),
  async (req, res) => {
    try {
      initializeStatusModel();
      const { id } = req.params;
      const updateData = req.body;

      // Se banco estiver desabilitado, simular atualização
      if (!NeighborhoodStatus) {
        const mockStatus = {
          id,
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
        return res.success(mockStatus, 'Status atualizado com sucesso');
      }

      const status = await NeighborhoodStatus.findByPk(id);
      if (!status) {
        return res.error('Status não encontrado', 404);
      }

      await status.update(updateData);
      
      res.success(status, 'Status atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.error('Dados inválidos', 422, error.errors);
      }
      
      res.error('Erro ao atualizar status', 500);
    }
  }
);

/**
 * POST /api/status/:id/resolve
 * Marca um status como resolvido
 */
router.post('/:id/resolve',
  validateParams(commonSchemas.uuidParam),
  async (req, res) => {
    try {
      initializeStatusModel();
      const { id } = req.params;

      if (!NeighborhoodStatus) {
        return res.success(null, 'Status marcado como resolvido');
      }

      const status = await NeighborhoodStatus.findByPk(id);
      if (!status) {
        return res.error('Status não encontrado', 404);
      }

      await status.markAsResolved();
      
      res.success(status, 'Status marcado como resolvido');
    } catch (error) {
      console.error('Erro ao resolver status:', error);
      res.error('Erro ao resolver status', 500);
    }
  }
);

/**
 * POST /api/status/:id/unresolve
 * Marca um status como não resolvido
 */
router.post('/:id/unresolve',
  validateParams(commonSchemas.uuidParam),
  async (req, res) => {
    try {
      initializeStatusModel();
      const { id } = req.params;

      if (!NeighborhoodStatus) {
        return res.success(null, 'Status marcado como não resolvido');
      }

      const status = await NeighborhoodStatus.findByPk(id);
      if (!status) {
        return res.error('Status não encontrado', 404);
      }

      await status.markAsUnresolved();
      
      res.success(status, 'Status marcado como não resolvido');
    } catch (error) {
      console.error('Erro ao marcar status como não resolvido:', error);
      res.error('Erro ao marcar status como não resolvido', 500);
    }
  }
);

/**
 * DELETE /api/status/:id
 * Remove um status
 */
router.delete('/:id',
  validateParams(commonSchemas.uuidParam),
  async (req, res) => {
    try {
      initializeStatusModel();
      const { id } = req.params;

      // Se banco estiver desabilitado, simular remoção
      if (!NeighborhoodStatus) {
        return res.success(null, 'Status removido com sucesso');
      }

      const status = await NeighborhoodStatus.findByPk(id);
      if (!status) {
        return res.error('Status não encontrado', 404);
      }

      await status.destroy();
      
      res.success(null, 'Status removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover status:', error);
      res.error('Erro ao remover status', 500);
    }
  }
);

module.exports = router;