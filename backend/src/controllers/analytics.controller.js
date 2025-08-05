const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/jwt.auth');
const { database } = require('../database/database');
const { createNeighborhoodStatusModel } = require('../models/neighborhood-status.model');
const { Op } = require('sequelize');

/**
 * Controller de análises - Express Router
 * Gerencia operações de análise de interrupções
 */
const router = express.Router();

// Inicializar modelo
let NeighborhoodStatus = null;

// Middleware para inicializar modelos quando necessário
router.use(async (req, res, next) => {
  if (!NeighborhoodStatus && database.getSequelize()) {
    NeighborhoodStatus = createNeighborhoodStatusModel(database.getSequelize());
  }
  next();
});

/**
 * GET /api/analytics/interruptions
 * Obter análise de interrupções
 * Requer autenticação de admin
 */
router.get('/interruptions', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!database.getSequelize()) {
      // Dados mock para quando o banco não estiver disponível
      return res.success({
        totalInterruptions: 15,
        averageDuration: 4.2,
        affectedNeighborhoods: 8,
        byNeighborhood: [
          { neighborhood: 'Centro', interruptions: 3, totalHours: 12 },
          { neighborhood: 'Vila Rica', interruptions: 2, totalHours: 8 },
          { neighborhood: 'Bela Vista', interruptions: 4, totalHours: 18 },
          { neighborhood: 'São Cristóvão', interruptions: 1, totalHours: 3 },
          { neighborhood: 'Eldorado', interruptions: 2, totalHours: 9 },
          { neighborhood: 'Carneirinhos', interruptions: 1, totalHours: 2 },
          { neighborhood: 'Novo Horizonte', interruptions: 1, totalHours: 4 },
          { neighborhood: 'Santa Terezinha', interruptions: 1, totalHours: 5 }
        ],
        monthlyTrend: [
          { month: 'Jan', interruptions: 2 },
          { month: 'Fev', interruptions: 1 },
          { month: 'Mar', interruptions: 3 },
          { month: 'Abr', interruptions: 2 },
          { month: 'Mai', interruptions: 4 },
          { month: 'Jun', interruptions: 3 }
        ]
      }, 'Análise de interrupções obtida com sucesso');
    }

    // Buscar dados reais do banco
    const totalInterruptions = await NeighborhoodStatus.count({
      where: {
        status: ['desabastecido', 'manutencao']
      }
    });

    // Análise por bairro
    const byNeighborhood = await NeighborhoodStatus.findAll({
      attributes: [
        'bairro',
        [database.getSequelize().fn('COUNT', database.getSequelize().col('id')), 'interruptions']
      ],
      where: {
        status: ['desabastecido', 'manutencao']
      },
      group: ['bairro'],
      order: [[database.getSequelize().fn('COUNT', database.getSequelize().col('id')), 'DESC']]
    });

    // Contar bairros únicos afetados
    const affectedNeighborhoods = byNeighborhood.length;

    // Calcular duração média (simulada baseada no número de registros)
    const averageDuration = totalInterruptions > 0 ? (totalInterruptions * 2.5) : 0;

    // Tendência mensal (últimos 6 meses)
    const monthlyTrend = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    for (let i = 0; i < 6; i++) {
      const count = await NeighborhoodStatus.count({
        where: {
          status: ['desabastecido', 'manutencao'],
          updated_at: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - (5 - i)))
          }
        }
      });
      monthlyTrend.push({
        month: months[i],
        interruptions: count
      });
    }

    const analytics = {
      totalInterruptions,
      averageDuration: parseFloat(averageDuration.toFixed(1)),
      affectedNeighborhoods,
      byNeighborhood: byNeighborhood.map(item => ({
        neighborhood: item.bairro,
        interruptions: parseInt(item.dataValues.interruptions),
        totalHours: parseInt(item.dataValues.interruptions) * 2.5 // Estimativa
      })),
      monthlyTrend
    };

    res.success(analytics, 'Análise de interrupções obtida com sucesso');
  } catch (error) {
    console.error('Erro ao obter análise de interrupções:', error);
    res.error('Erro ao obter análise de interrupções', 500, error.message);
  }
});

/**
 * GET /api/analytics/summary
 * Obter resumo geral das análises
 * Requer autenticação de admin
 */
router.get('/summary', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!database.getSequelize()) {
      return res.success({
        totalNeighborhoods: 25,
        activeInterruptions: 3,
        resolvedToday: 2,
        averageResolutionTime: 3.5
      }, 'Resumo obtido com sucesso');
    }

    const totalNeighborhoods = await NeighborhoodStatus.count({
      distinct: true,
      col: 'bairro'
    });

    const activeInterruptions = await NeighborhoodStatus.count({
      where: {
        status: ['desabastecido', 'manutencao']
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const resolvedToday = await NeighborhoodStatus.count({
      where: {
        status: 'ok',
        updated_at: {
          [database.getSequelize().Op.gte]: today
        }
      }
    });

    const summary = {
      totalNeighborhoods,
      activeInterruptions,
      resolvedToday,
      averageResolutionTime: 3.5 // Valor estimado
    };

    res.success(summary, 'Resumo obtido com sucesso');
  } catch (error) {
    console.error('Erro ao obter resumo:', error);
    res.error('Erro ao obter resumo', 500, error.message);
  }
});

module.exports = router;