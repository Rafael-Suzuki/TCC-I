const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'monitor_agua',
  password: process.env.DB_PASS || '231090',
  port: process.env.DB_PORT || 5432,
});

async function removeMaintenanceStatus() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando remoção dos status de manutenção...');
    
    // Verificar os status atuais
    console.log('\nStatus atuais no banco:');
    const currentData = await client.query('SELECT bairro, status FROM neighborhood_status ORDER BY bairro');
    currentData.rows.forEach(row => {
      console.log(`- ${row.bairro}: ${row.status}`);
    });
    
    // Migrar status de manutenção para status básicos
    console.log('\nMigrando status de manutenção...');
    
    // intermitente_manutencao -> intermitente
    const intermitenteMigration = await client.query(`
      UPDATE neighborhood_status 
      SET status = 'intermitente' 
      WHERE status = 'intermitente_manutencao'
    `);
    if (intermitenteMigration.rowCount > 0) {
      console.log(`- ${intermitenteMigration.rowCount} registros migrados de 'intermitente_manutencao' para 'intermitente'`);
    }
    
    // falta_manutencao -> falta
    const faltaMigration = await client.query(`
      UPDATE neighborhood_status 
      SET status = 'falta' 
      WHERE status = 'falta_manutencao'
    `);
    if (faltaMigration.rowCount > 0) {
      console.log(`- ${faltaMigration.rowCount} registros migrados de 'falta_manutencao' para 'falta'`);
    }
    
    // Remover a constraint antiga
    console.log('\nRemoção da constraint antiga...');
    await client.query(`
      ALTER TABLE neighborhood_status 
      DROP CONSTRAINT IF EXISTS neighborhood_status_status_check
    `);
    
    // Adicionar a nova constraint com apenas os 4 status
    console.log('Adicionando nova constraint com os status simplificados...');
    await client.query(`
      ALTER TABLE neighborhood_status 
      ADD CONSTRAINT neighborhood_status_status_check 
      CHECK (status IN ('normal', 'intermitente', 'falta', 'sem_informacao'))
    `);
    
    // Verificar os status finais
    console.log('\nStatus finais no banco:');
    const finalData = await client.query('SELECT bairro, status FROM neighborhood_status ORDER BY bairro');
    finalData.rows.forEach(row => {
      console.log(`- ${row.bairro}: ${row.status}`);
    });
    
    // Estatísticas finais
    console.log('\nEstatísticas dos status:');
    const stats = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM neighborhood_status 
      GROUP BY status 
      ORDER BY status
    `);
    stats.rows.forEach(row => {
      console.log(`- ${row.status}: ${row.count} bairros`);
    });
    
    console.log('\n✅ Remoção dos status de manutenção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a migração
removeMaintenanceStatus()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na migração:', error);
    process.exit(1);
  });