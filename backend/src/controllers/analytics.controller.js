const express = require('express');
const Joi = require('joi');
const { validateQuery } = require('../pipes/validation.pipe');
const { StatusService } = require('../status/status.service');
const { requireAuth } = require('../middleware/jwt.auth');
const { database } = require('../database/database');

/**
 * Controller de Analytics - Express Router
 * Gerencia operações de análise de dados e relatórios
 */
const router = express.Router();

// Instância do serviço de status
const statusService = new StatusService();

/**
 * Schema de validação para parâmetros de período
 */
const periodSchema = Joi.object({
  from: Joi.string().isoDate().optional().description('Data inicial (ISO format)'),
  to: Joi.string().isoDate().optional().description('Data final (ISO format)'),
});

/**
 * GET /api/analytics/overview
 * Retorna visão geral das métricas do sistema
 */
router.get('/overview',
  requireAuth, // Proteger com JWT
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
      
      // Calcular disponibilidade
      const availability = await calculateAvailability({ from, to });
      
      const response = {
        success: true,
        data: {
          now: currentStats,
          incidents: {
            total: incidentStats.total || 0
          },
          mttr_min: mttr,
          availability_pct: availability
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao obter overview de analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics/ranking
 * Retorna ranking de bairros por incidentes e downtime
 */
router.get('/ranking',
  requireAuth, // Proteger com JWT
  validateQuery(periodSchema),
  async (req, res) => {
    try {
      const { from, to } = req.query;
      
      // Garantir que o banco de dados está inicializado
      if (!database.getSequelize()) {
        await database.initialize();
      }
      
      // Ranking por número de incidentes
      const byIncidents = await getRankingByIncidents({ from, to });
      
      // Ranking por tempo de downtime
      const byDowntime = await getRankingByDowntime({ from, to });
      
      const response = {
        success: true,
        data: {
          by_incidents: byIncidents,
          by_downtime_min: byDowntime
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao obter ranking de analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics/timeseries/incidents
 * Retorna série temporal de incidentes
 */
router.get('/timeseries/incidents',
  requireAuth, // Proteger com JWT
  validateQuery(periodSchema.keys({
    granularity: Joi.string().valid('day', 'week', 'month').default('day')
  })),
  async (req, res) => {
    try {
      const { from, to, granularity } = req.query;
      
      // Garantir que o banco de dados está inicializado
      if (!database.getSequelize()) {
        await database.initialize();
      }
      
      // Obter série temporal de incidentes
      const timeseries = await getIncidentsTimeseries({ from, to, granularity });
      
      const response = {
        success: true,
        data: {
          points: timeseries
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao obter série temporal de incidentes:', error);
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
    // Garantir que o banco de dados está inicializado
    if (!database.getSequelize()) {
      await database.initialize();
    }
    
    const sequelize = database.getSequelize();
    if (!sequelize) {
      // Retornar dados mock se banco não estiver disponível
      return {
        normal: 7,
        intermitente: 2,
        falta: 1,
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
      WHERE changed_at BETWEEN :fromDate AND :toDate
        AND status IN ('intermitente', 'falta')
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
 * Função auxiliar: Calcular MTTR (Mean Time To Recovery)
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

    // Buscar todos os bairros que tiveram problemas no período
    const neighborhoodsQuery = `
      SELECT DISTINCT neighborhood_id
      FROM status_history
      WHERE changed_at BETWEEN :fromDate AND :toDate
        AND status IN ('intermitente', 'falta')
    `;

    const neighborhoods = await sequelize.query(neighborhoodsQuery, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    if (neighborhoods.length === 0) {
      return 0;
    }

    const incidentDurations = [];

    // Para cada bairro, calcular a duração real dos incidentes resolvidos
    for (const neighborhood of neighborhoods) {
      // Buscar histórico completo do bairro no período, ordenado por data
      const historyQuery = `
        SELECT status, changed_at
        FROM status_history
        WHERE neighborhood_id = :neighborhoodId
          AND changed_at BETWEEN :fromDate AND :toDate
        ORDER BY changed_at ASC
      `;

      const history = await sequelize.query(historyQuery, {
        replacements: { 
          neighborhoodId: neighborhood.neighborhood_id,
          fromDate,
          toDate 
        },
        type: sequelize.QueryTypes.SELECT
      });

      if (history.length === 0) continue;

      let problemStartTime = null;

      // Analisar sequência de mudanças de status
      for (let i = 0; i < history.length; i++) {
        const currentRecord = history[i];
        const currentStatus = currentRecord.status;
        const currentTime = new Date(currentRecord.changed_at);

        if (currentStatus === 'intermitente' || currentStatus === 'falta') {
          // Início de um problema
          if (!problemStartTime) {
            problemStartTime = currentTime;
          }
        } else if (currentStatus === 'normal') {
          // Fim de um problema - calcular duração
          if (problemStartTime) {
            const durationMs = currentTime.getTime() - problemStartTime.getTime();
            const durationMinutes = durationMs / (1000 * 60);
            incidentDurations.push(durationMinutes);
            problemStartTime = null;
          }
        }
      }
    }

    // Calcular média das durações dos incidentes resolvidos
    if (incidentDurations.length === 0) {
      return 0;
    }

    const totalDuration = incidentDurations.reduce((sum, duration) => sum + duration, 0);
    const avgMTTR = totalDuration / incidentDurations.length;

    return Math.round(avgMTTR);
  } catch (error) {
    console.error('Erro ao calcular MTTR:', error);
    return 0;
  }
}

/**
 * Função auxiliar: Calcular disponibilidade
 */
async function calculateAvailability(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return 95.0; // Valor mock
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

    // Buscar todos os bairros que tiveram mudanças no período
    const neighborhoodsQuery = `
      SELECT DISTINCT neighborhood_id
      FROM status_history
      WHERE changed_at BETWEEN :fromDate AND :toDate
    `;

    const neighborhoods = await sequelize.query(neighborhoodsQuery, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    let totalDowntimeMinutes = 0;

    // Para cada bairro, calcular o tempo real de downtime
    for (const neighborhood of neighborhoods) {
      // Buscar histórico completo do bairro no período, ordenado por data
      const historyQuery = `
        SELECT status, changed_at
        FROM status_history
        WHERE neighborhood_id = :neighborhoodId
          AND changed_at BETWEEN :fromDate AND :toDate
        ORDER BY changed_at ASC
      `;

      const history = await sequelize.query(historyQuery, {
        replacements: { 
          neighborhoodId: neighborhood.neighborhood_id,
          fromDate,
          toDate 
        },
        type: sequelize.QueryTypes.SELECT
      });

      if (history.length === 0) continue;

      let problemStartTime = null;

      // Analisar sequência de mudanças de status
      for (let i = 0; i < history.length; i++) {
        const currentRecord = history[i];
        const currentStatus = currentRecord.status;
        const currentTime = new Date(currentRecord.changed_at);

        if (currentStatus === 'intermitente' || currentStatus === 'falta') {
          // Início de um problema
          if (!problemStartTime) {
            problemStartTime = currentTime;
          }
        } else if (currentStatus === 'normal') {
          // Fim de um problema
          if (problemStartTime) {
            const downtimeMs = currentTime.getTime() - problemStartTime.getTime();
            const downtimeMinutes = downtimeMs / (1000 * 60);
            totalDowntimeMinutes += downtimeMinutes;
            problemStartTime = null;
          }
        }
      }

      // Se ainda há um problema em andamento no final do período
      if (problemStartTime) {
        const downtimeMs = toDate.getTime() - problemStartTime.getTime();
        const downtimeMinutes = downtimeMs / (1000 * 60);
        totalDowntimeMinutes += downtimeMinutes;
      }
    }

    const availability = ((totalSystemMinutes - totalDowntimeMinutes) / totalSystemMinutes) * 100;

    // Manter 2 casas decimais sem arredondar para 100% quando próximo
    return Math.max(0, Math.min(100, parseFloat(availability.toFixed(2))));
  } catch (error) {
    console.error('Erro ao calcular disponibilidade:', error);
    return 95.0; // Valor padrão
  }
}

/**
 * Função auxiliar: Ranking por incidentes
 */
async function getRankingByIncidents(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return [];
    }

    const { from, to } = options;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Buscar incidentes reais da tabela status_history
    const query = `
      SELECT 
        sh.neighborhood_id,
        ns.bairro as name,
        COUNT(*) as count
      FROM status_history sh
      JOIN neighborhood_status ns ON sh.neighborhood_id = ns.id
      WHERE sh.changed_at BETWEEN :fromDate AND :toDate
        AND sh.status IN ('intermitente', 'falta')
      GROUP BY sh.neighborhood_id, ns.bairro
      ORDER BY count DESC, ns.bairro ASC
      LIMIT 5
    `;

    const results = await sequelize.query(query, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Se não houver incidentes no período, retornar array vazio
    if (results.length === 0) {
      return [];
    }

    return results.map(row => ({
      neighborhood_id: row.neighborhood_id,
      name: row.name,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Erro ao obter ranking por incidentes:', error);
    return [];
  }
}

/**
 * Função auxiliar: Ranking por downtime
 */
async function getRankingByDowntime(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return [];
    }

    const { from, to } = options;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Buscar todos os bairros que tiveram problemas no período
    const neighborhoodsQuery = `
      SELECT DISTINCT sh.neighborhood_id, ns.bairro as name
      FROM status_history sh
      JOIN neighborhood_status ns ON sh.neighborhood_id = ns.id
      WHERE sh.changed_at BETWEEN :fromDate AND :toDate
        AND sh.status IN ('intermitente', 'falta')
    `;

    const neighborhoods = await sequelize.query(neighborhoodsQuery, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    if (neighborhoods.length === 0) {
      return [];
    }

    const downtimeResults = [];

    // Para cada bairro, calcular o tempo real de downtime
    for (const neighborhood of neighborhoods) {
      // Buscar histórico completo do bairro no período, ordenado por data
      const historyQuery = `
        SELECT status, changed_at
        FROM status_history
        WHERE neighborhood_id = :neighborhoodId
          AND changed_at BETWEEN :fromDate AND :toDate
        ORDER BY changed_at ASC
      `;

      const history = await sequelize.query(historyQuery, {
        replacements: { 
          neighborhoodId: neighborhood.neighborhood_id,
          fromDate,
          toDate 
        },
        type: sequelize.QueryTypes.SELECT
      });

      if (history.length === 0) continue;

      let totalDowntimeMinutes = 0;
      let problemStartTime = null;

      // Analisar sequência de mudanças de status
      for (let i = 0; i < history.length; i++) {
        const currentRecord = history[i];
        const currentStatus = currentRecord.status;
        const currentTime = new Date(currentRecord.changed_at);

        if (currentStatus === 'intermitente' || currentStatus === 'falta') {
          // Início de um problema
          if (!problemStartTime) {
            problemStartTime = currentTime;
          }
        } else if (currentStatus === 'normal') {
          // Fim de um problema
          if (problemStartTime) {
            const downtimeMs = currentTime.getTime() - problemStartTime.getTime();
            const downtimeMinutes = Math.round(downtimeMs / (1000 * 60));
            totalDowntimeMinutes += downtimeMinutes;
            problemStartTime = null;
          }
        }
      }

      // Se ainda há um problema em andamento no final do período
      if (problemStartTime) {
        const downtimeMs = toDate.getTime() - problemStartTime.getTime();
        const downtimeMinutes = Math.round(downtimeMs / (1000 * 60));
        totalDowntimeMinutes += downtimeMinutes;
      }

      if (totalDowntimeMinutes > 0) {
        downtimeResults.push({
          neighborhood_id: neighborhood.neighborhood_id,
          name: neighborhood.name,
          minutes: totalDowntimeMinutes
        });
      }
    }

    // Ordenar por tempo de downtime (maior primeiro) e limitar a 5
    return downtimeResults
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

  } catch (error) {
    console.error('Erro ao obter ranking por downtime:', error);
    return [];
  }
}

/**
 * Função auxiliar: Série temporal de incidentes
 */
async function getIncidentsTimeseries(options = {}) {
  try {
    const sequelize = database.getSequelize();
    if (!sequelize) {
      return [];
    }

    const { from, to, granularity = 'day' } = options;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Definir formato de data baseado na granularidade
    let dateFormat;
    switch (granularity) {
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default: // day
        dateFormat = 'YYYY-MM-DD';
    }

    const query = `
      SELECT 
        TO_CHAR(changed_at, '${dateFormat}') as date,
        COUNT(*) as count
      FROM status_history 
      WHERE changed_at BETWEEN :fromDate AND :toDate
        AND status IN ('intermitente', 'falta')
      GROUP BY TO_CHAR(changed_at, '${dateFormat}')
      ORDER BY date
    `;

    const results = await sequelize.query(query, {
      replacements: { fromDate, toDate },
      type: sequelize.QueryTypes.SELECT
    });

    return results.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Erro ao obter série temporal de incidentes:', error);
    return [];
  }
}

module.exports = router;