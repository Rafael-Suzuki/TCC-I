const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agua_ouro_preto',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Função principal de diagnóstico
async function diagnosticarRanking24h() {
  try {
    console.log('🔍 INICIANDO DIAGNÓSTICO DO RANKING 24H');
    console.log('=' .repeat(50));

    // 1. Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida');

    // 2. Verificar dados gerais de status_history
    console.log('\n📊 VERIFICANDO DADOS DE STATUS_HISTORY:');
    
    const totalRegistros = await sequelize.query(
      'SELECT COUNT(*) as total FROM status_history',
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`Total de registros: ${totalRegistros[0].total}`);

    // Últimas 24h
    const registros24h = await sequelize.query(
      `SELECT COUNT(*) as total FROM status_history 
       WHERE created_at >= NOW() - INTERVAL '24 hours'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`Registros últimas 24h: ${registros24h[0].total}`);

    // Últimos 7 dias
    const registros7d = await sequelize.query(
      `SELECT COUNT(*) as total FROM status_history 
       WHERE created_at >= NOW() - INTERVAL '7 days'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`Registros últimos 7 dias: ${registros7d[0].total}`);

    // 3. Verificar registros recentes detalhados
    console.log('\n📋 REGISTROS RECENTES (últimas 48h):');
    const registrosRecentes = await sequelize.query(
      `SELECT bairro, status, created_at 
       FROM status_history 
       WHERE created_at >= NOW() - INTERVAL '48 hours'
       ORDER BY created_at DESC 
       LIMIT 20`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    registrosRecentes.forEach(reg => {
      console.log(`${reg.bairro}: ${reg.status} (${new Date(reg.created_at).toLocaleString('pt-BR')})`);
    });

    // 4. Testar consulta de ranking 24h (incidentes)
    console.log('\n🏆 TESTANDO RANKING 24H - INCIDENTES:');
    const ranking24hIncidentes = await sequelize.query(
      `SELECT 
         bairro,
         COUNT(*) as incident_count
       FROM status_history 
       WHERE created_at >= NOW() - INTERVAL '24 hours'
         AND status != 'normal'
       GROUP BY bairro 
       ORDER BY incident_count DESC 
       LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('Ranking 24h por incidentes:');
    ranking24hIncidentes.forEach((item, index) => {
      console.log(`${index + 1}. ${item.bairro}: ${item.incident_count} incidentes`);
    });

    // 5. Testar consulta de ranking 24h (downtime)
    console.log('\n⏱️  TESTANDO RANKING 24H - DOWNTIME:');
    const ranking24hDowntime = await sequelize.query(
      `WITH status_periods AS (
         SELECT 
           bairro,
           status,
           created_at,
           LEAD(created_at) OVER (PARTITION BY bairro ORDER BY created_at) as next_change
         FROM status_history 
         WHERE created_at >= NOW() - INTERVAL '24 hours'
       )
       SELECT 
         bairro,
         SUM(
           CASE 
             WHEN status != 'normal' THEN 
               EXTRACT(EPOCH FROM (COALESCE(next_change, NOW()) - created_at)) / 60
             ELSE 0
           END
         ) as downtime_minutes
       FROM status_periods
       GROUP BY bairro
       HAVING SUM(
         CASE 
           WHEN status != 'normal' THEN 
             EXTRACT(EPOCH FROM (COALESCE(next_change, NOW()) - created_at)) / 60
           ELSE 0
         END
       ) > 0
       ORDER BY downtime_minutes DESC
       LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('Ranking 24h por downtime:');
    ranking24hDowntime.forEach((item, index) => {
      console.log(`${index + 1}. ${item.bairro}: ${Math.round(item.downtime_minutes)} minutos`);
    });

    // 6. Análise específica do bairro Aclimação
    console.log('\n🔍 ANÁLISE ESPECÍFICA - BAIRRO ACLIMAÇÃO:');
    const aclimacaoHistorico = await sequelize.query(
      `SELECT status, created_at 
       FROM status_history 
       WHERE bairro = 'Aclimação' 
         AND created_at >= NOW() - INTERVAL '72 hours'
       ORDER BY created_at DESC`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('Histórico Aclimação (últimas 72h):');
    aclimacaoHistorico.forEach(reg => {
      console.log(`${reg.status} - ${new Date(reg.created_at).toLocaleString('pt-BR')}`);
    });

    // 7. Comparar com ranking 7 dias
    console.log('\n📊 COMPARAÇÃO COM RANKING 7 DIAS:');
    const ranking7d = await sequelize.query(
      `SELECT 
         bairro,
         COUNT(*) as incident_count
       FROM status_history 
       WHERE created_at >= NOW() - INTERVAL '7 days'
         AND status != 'normal'
       GROUP BY bairro 
       ORDER BY incident_count DESC 
       LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('Ranking 7 dias por incidentes:');
    ranking7d.forEach((item, index) => {
      console.log(`${index + 1}. ${item.bairro}: ${item.incident_count} incidentes`);
    });

    // 8. Diagnóstico automático
    console.log('\n🎯 DIAGNÓSTICO AUTOMÁTICO:');
    console.log('=' .repeat(50));
    
    if (registros24h[0].total === '0') {
      console.log('❌ PROBLEMA IDENTIFICADO: Não há registros nas últimas 24h');
      console.log('💡 SOLUÇÃO: Verificar se o sistema está registrando mudanças de status');
    } else if (ranking24hIncidentes.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Não há incidentes nas últimas 24h');
      console.log('💡 POSSÍVEL CAUSA: Todos os bairros estão com status "normal"');
    } else {
      console.log('✅ Dados de 24h parecem normais');
      
      const aclimacaoEm24h = ranking24hIncidentes.find(item => item.bairro === 'Aclimação');
      if (!aclimacaoEm24h) {
        console.log('❌ PROBLEMA: Aclimação não aparece no ranking 24h');
        console.log('💡 POSSÍVEL CAUSA: Mudança de status da Aclimação foi há mais de 24h');
      } else {
        console.log(`✅ Aclimação encontrada no ranking 24h: ${aclimacaoEm24h.incident_count} incidentes`);
      }
    }

    // 9. Verificar timestamp da última mudança da Aclimação
    console.log('\n⏰ VERIFICANDO TIMESTAMP DA ÚLTIMA MUDANÇA - ACLIMAÇÃO:');
    const ultimaMudancaAclimacao = await sequelize.query(
      `SELECT status, created_at 
       FROM status_history 
       WHERE bairro = 'Aclimação' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (ultimaMudancaAclimacao.length > 0) {
      const ultimaData = new Date(ultimaMudancaAclimacao[0].created_at);
      const agora = new Date();
      const diferencaHoras = (agora - ultimaData) / (1000 * 60 * 60);
      
      console.log(`Última mudança: ${ultimaData.toLocaleString('pt-BR')}`);
      console.log(`Status: ${ultimaMudancaAclimacao[0].status}`);
      console.log(`Há ${Math.round(diferencaHoras)} horas atrás`);
      
      if (diferencaHoras > 24) {
        console.log('❌ PROBLEMA CONFIRMADO: Última mudança da Aclimação foi há mais de 24h');
        console.log('💡 Por isso não aparece no ranking de 24h');
      } else {
        console.log('✅ Mudança está dentro das últimas 24h');
      }
    }

    console.log('\n🏁 DIAGNÓSTICO CONCLUÍDO');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    
    if (error.message.includes('connect')) {
      console.log('💡 Erro de conexão. Verifique:');
      console.log('   - Se o PostgreSQL está rodando');
      console.log('   - Se as credenciais no .env estão corretas');
      console.log('   - Se o banco "agua_ouro_preto" existe');
    }
  } finally {
    await sequelize.close();
  }
}

// Executar diagnóstico
diagnosticarRanking24h();