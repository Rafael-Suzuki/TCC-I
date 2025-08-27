const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'monitor_agua',
  password: '231090',
  port: 5432,
});

/**
 * Script para popular a tabela status_history com dados históricos simulados
 * Isso permitirá que as análises funcionem corretamente
 */
async function populateStatusHistory() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando população da tabela status_history...');
    
    // Primeiro, verificar se já existem dados
    const existingData = await client.query('SELECT COUNT(*) as count FROM status_history');
    console.log(`📊 Registros existentes na status_history: ${existingData.rows[0].count}`);
    
    // Buscar todos os bairros
    const neighborhoods = await client.query('SELECT id, bairro, status FROM neighborhood_status ORDER BY id');
    console.log(`🏘️  Total de bairros encontrados: ${neighborhoods.rows.length}`);
    
    // Gerar dados históricos para os últimos 30 dias
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Gerando dados de ${thirtyDaysAgo.toISOString()} até ${now.toISOString()}`);
    
    let totalInserted = 0;
    
    for (const neighborhood of neighborhoods.rows) {
      console.log(`\n🔄 Processando bairro: ${neighborhood.bairro}`);
      
      // Gerar entre 3-8 mudanças de status nos últimos 30 dias
      const numChanges = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < numChanges; i++) {
        // Data aleatória nos últimos 30 dias
        const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
        const changeDate = new Date(randomTime);
        
        // Status aleatório (com maior probabilidade de problemas)
        const statuses = ['normal', 'intermitente', 'falta'];
        const weights = [0.6, 0.3, 0.1]; // 60% normal, 30% intermitente, 10% falta
        
        let randomStatus;
        const rand = Math.random();
        if (rand < weights[0]) {
          randomStatus = statuses[0];
        } else if (rand < weights[0] + weights[1]) {
          randomStatus = statuses[1];
        } else {
          randomStatus = statuses[2];
        }
        
        // Inserir registro histórico
        await client.query(
          `INSERT INTO status_history (neighborhood_id, status, changed_at, source, notes) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            neighborhood.id,
            randomStatus,
            changeDate,
            'simulation',
            `Status simulado para análises - mudança ${i + 1}`
          ]
        );
        
        totalInserted++;
      }
      
      console.log(`   ✅ ${numChanges} registros inseridos para ${neighborhood.bairro}`);
    }
    
    console.log(`\n🎉 População concluída! Total de registros inseridos: ${totalInserted}`);
    
    // Verificar estatísticas finais
    const finalStats = await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        MIN(changed_at) as first_change,
        MAX(changed_at) as last_change
      FROM status_history 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Estatísticas finais da status_history:');
    finalStats.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} registros (${row.first_change.toISOString().split('T')[0]} - ${row.last_change.toISOString().split('T')[0]})`);
    });
    
    // Testar consulta de incidentes
    const incidentTest = await client.query(`
      SELECT COUNT(*) as total
      FROM status_history 
      WHERE changed_at BETWEEN $1 AND $2
        AND status IN ('intermitente', 'falta')
    `, [thirtyDaysAgo, now]);
    
    console.log(`\n🔍 Teste de consulta de incidentes (últimos 30 dias): ${incidentTest.rows[0].total} incidentes`);
    
  } catch (error) {
    console.error('❌ Erro durante a população:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
populateStatusHistory()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na execução:', error);
    process.exit(1);
  });