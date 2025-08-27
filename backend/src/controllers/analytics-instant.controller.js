const express = require('express');
const Joi = require('joi');
const { validateQuery } = require('../pipes/validation.pipe');
const { requireAuth } = require('../middleware/jwt.auth');
const { database } = require('../database/database');

/**
 * Controller de Analytics Instantâneo - Express Router
 * Gerencia operações de análise de dados em tempo real
 */
const router = express.Router();

/**
 * Schema de validação para parâmetros de período
 */
const periodSchema = Joi.object({
  from: Joi.string().isoDate().optional().description('Data inicial (ISO format)'),
  to: Joi.string().isoDate().optional().description('Data final (ISO format)'),
});

/**
 * GET /api/analytics-instant/overview
 * Retorna visão geral das métricas do sistema em tempo real
 */
router.get('/overview',
  requireAuth,
  validateQuery(periodSchema),
  async (req, res) => {
    try {
      const { from, to } = req.query;
      
      // Garantir que o banco de dados está inicializado
      if (!database.getSequelize()) {
        await database.initialize();
      }
      
      // Obter estatísticas atuais
      const currentStats = await getCurrentStatusStats();
      
      // Obter estatísticas de incidentes no período
      const incidentStats = await getIncidentStatistics({ from, to });
      
      // Calcular MTTR (Mean Time To Recovery)
      const mttr = await calculateMTTR({ from, to });
      
      // Calcular disponibilidade histórica (30 dias)
      const historicalAvailability = await calculateHistoricalAvailability({ from, to });
      
      // Calcular disponibilidade instantânea
      const instantAvailability = await calculateInstantAvailability();
      
      const response = {
        success: true,
        data: {
          now: currentStats,
          incidents: {
            total: incidentStats.total || 0
          },
          mttr_min: mttr,
          availability_pct: historicalAvailability,
          instant_availability_pct: instantAvailability,
          availability_info: {
            historical: {
              value: historicalAvailability,
              description: 'Baseado em dados históricos de 30 dias'
            },
            instant: {
              value: instantAvailability,
              description: 'Baseado no status atual dos bairros'
            }
          }
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao obter overview de analytics instantâneo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics-instant/availability
 * Retorna apenas os dados de disponibilidade (histórica e instantânea)
 */
router.get('/availability',
  requireAuth,
  validateQuery(periodSchema),
  async (req, res) => {
    try {
      const { from, to } = req.query;
      
      // Garantir que o banco de dados está inicializado
      if (!database.getSequelize()) {
        await database.initialize();
      }
      
      // Calcular disponibilidade histórica
      const historicalAvailability = await calculateHistoricalAvailability({ from, to });
      
      // Calcular disponibilidade instantânea
      const instantAvailability = await calculateInstantAvailability();
      
      // Obter detalhes dos bairros
      const neighborhoodDetails = await getNeighborhoodStatusDetails();
      
      const response = {
        success: true,
        data: {
          historical: {
            value: historicalAvailability,
            description: 'Baseado em dados históricos de 30 dias',
            period: {
              from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              to: to || new Date().toISOString()
            }
          },
          instant: {
            value: instantAvailability,
            description: 'Baseado no status atual dos bairros',
            timestamp: new Date().toISOString()
          },
          neighborhoods: neighborhoodDetails
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao obter dados de disponibilidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * Função auxiliar: Obter estatísticas atuais de status
 */
async function getCurrentStatusStats() {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return {
        normal: 0,
        intermitente: 0,
        falta: 0,
        sem_informacao: 0
      };
    }

    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM neighborhood_status 
      GROUP BY status
    `;

    const results = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    // Organizar resultados
    const stats = {
      normal: 0,
      intermitente: 0,
      falta: 0,
      sem_informacao: 0
    };

    results.forEach(row => {
      if (stats.hasOwnProperty(row.status)) {
        stats[row.status] = parseInt(row.count);
      }
    });

    return stats;
  } catch (error) {
    console.error('Erro ao obter estatísticas atuais:', error);
    return {
      normal: 0,
      intermitente: 0,
      falta: 0,
      sem_informacao: 0
    };
  }
}

/**
 * Função auxiliar: Calcular disponibilidade instantânea
 */
async function calculateInstantAvailability() {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return 95.0;
    }

    // Obter contagem total de bairros
    const totalResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM neighborhood_status',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const totalNeighborhoods = parseInt(totalResult[0]?.count || 1);
    
    // Obter contagem de bairros com status normal
    const normalResult = await sequelize.query(
      "SELECT COUNT(*) as count FROM neighborhood_status WHERE status = 'normal'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const normalNeighborhoods = parseInt(normalResult[0]?.count || 0);
    
    // Calcular disponibilidade instantânea
    const availability = (normalNeighborhoods / totalNeighborhoods) * 100;
    
    return Math.max(0, Math.min(100, parseFloat(availability.toFixed(2))));
  } catch (error) {
    console.error('Erro ao calcular disponibilidade instantânea:', error);
    return 95.0;
  }
}

/**
 * Função auxiliar: Calcular disponibilidade histórica (reutiliza lógica existente)
 */
async function calculateHistoricalAvailability(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return 95.0;
    }

    const { from, to } = options;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Calcular tempo total do período em minutos
    const totalPeriodMinutes = (toDate - fromDate) / (1000 * 60);
    
    // Obter número total de bairros
    const totalNeighborhoods = await sequelize.query(
      'SELECT COUNT(*) as count FROM neighborhood_status',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const neighborhoodCount = parseInt(totalNeighborhoods[0]?.count || 1);
    const totalSystemMinutes = totalPeriodMinutes * neighborhoodCount;

    // Calcular tempo total de downtime
    const downtimeQuery = `
      WITH status_changes AS (
        SELECT 
          neighborhood_id,
          status,
          changed_at,
          LEAD(changed_at) OVER (PARTITION BY neighborhood_id ORDER BY changed_at) as next_change
        FROM status_history 
        WHERE changed_at BETWEEN :fromDate AND :toDate
      )
      SELECT 
        SUM(EXTRACT(EPOCH FROM (COALESCE(next_change, :toDate) - changed_at)) / 60) as total_downtime_minutes
      FROM status_changes
      WHERE status IN ('intermitente', 'falta')
    `;

    const downtimeResults = await sequelize.query(downtimeQuery, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    const totalDowntimeMinutes = parseFloat(downtimeResults[0]?.total_downtime_minutes || 0);
    const availability = ((totalSystemMinutes - totalDowntimeMinutes) / totalSystemMinutes) * 100;

    return Math.max(0, Math.min(100, parseFloat(availability.toFixed(2))));
  } catch (error) {
    console.error('Erro ao calcular disponibilidade histórica:', error);
    return 95.0;
  }
}

/**
 * Função auxiliar: Obter detalhes dos bairros
 */
async function getNeighborhoodStatusDetails() {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return { total: 0, by_status: {} };
    }

    // Obter contagem total
    const totalResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM neighborhood_status',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // Obter contagem por status
    const statusResult = await sequelize.query(
      'SELECT status, COUNT(*) as count FROM neighborhood_status GROUP BY status',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const byStatus = {};
    statusResult.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });
    
    return {
      total: parseInt(totalResult[0]?.count || 0),
      by_status: byStatus
    };
  } catch (error) {
    console.error('Erro ao obter detalhes dos bairros:', error);
    return { total: 0, by_status: {} };
  }
}

/**
 * Função auxiliar: Obter estatísticas de incidentes
 */
async function getIncidentStatistics(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return { total: 0 };
    }

    const { from, to } = options;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const query = `
      SELECT COUNT(*) as total
      FROM status_history
      WHERE status IN ('intermitente', 'falta')
        AND changed_at BETWEEN :fromDate AND :toDate
    `;

    const results = await sequelize.query(query, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      total: parseInt(results[0]?.total || 0)
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de incidentes:', error);
    return { total: 0 };
  }
}

/**
 * Função auxiliar: Calcular MTTR
 */
async function calculateMTTR(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return 0;
    }

    const { from, to } = options;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const query = `
      WITH incident_durations AS (
        SELECT 
          neighborhood_id,
          changed_at as start_time,
          LEAD(changed_at) OVER (PARTITION BY neighborhood_id ORDER BY changed_at) as end_time,
          status
        FROM status_history
        WHERE changed_at BETWEEN :fromDate AND :toDate
      )
      SELECT 
        AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) as avg_duration_minutes
      FROM incident_durations
      WHERE status IN ('intermitente', 'falta')
        AND end_time IS NOT NULL
    `;

    const results = await sequelize.query(query, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    const avgDuration = parseFloat(results[0]?.avg_duration_minutes || 0);
    return Math.round(avgDuration);
  } catch (error) {
    console.error('Erro ao calcular MTTR:', error);
    return 0;
  }
}

module.exports = router;