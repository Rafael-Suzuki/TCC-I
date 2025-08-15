const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'monitor_agua',
  password: process.env.DB_PASS || '231090',
  port: process.env.DB_PORT || 5432,
});

async function updateStatusSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando atualização do schema de status...');
    
    // Primeiro, vamos verificar os status atuais
    console.log('\nStatus atuais no banco:');
    const currentData = await client.query('SELECT bairro, status FROM neighborhood_status ORDER BY bairro');
    currentData.rows.forEach(row => {
      console.log(`- ${row.bairro}: ${row.status}`);
    });
    
    // Mapear status antigos para novos ANTES de alterar a constraint
    console.log('\nMapeando status antigos para novos...');
    
    // manutencao -> intermitente_manutencao (se existir)
    const manutencaoUpdate = await client.query(`
      UPDATE neighborhood_status 
      SET status = 'intermitente_manutencao' 
      WHERE status = 'manutencao'
    `);
    if (manutencaoUpdate.rowCount > 0) {
      console.log(`- ${manutencaoUpdate.rowCount} registros atualizados de 'manutencao' para 'intermitente_manutencao'`);
    }
    
    // Remover a constraint antiga
    console.log('\nRemoção da constraint antiga...');
    await client.query(`
      ALTER TABLE neighborhood_status 
      DROP CONSTRAINT IF EXISTS neighborhood_status_status_check
    `);
    
    // Adicionar a nova constraint com os novos status
    console.log('Adicionando nova constraint com os novos status...');
    await client.query(`
      ALTER TABLE neighborhood_status 
      ADD CONSTRAINT neighborhood_status_status_check 
      CHECK (status IN ('normal', 'intermitente', 'intermitente_manutencao', 'falta', 'falta_manutencao', 'sem_informacao'))
    `);
    
    // Adicionar alguns exemplos dos novos status se não existirem
    console.log('\nAdicionando exemplos dos novos status...');
    
    const newStatusExamples = [
      { bairro: 'Vila Rica', status: 'intermitente_manutencao' },
      { bairro: 'Rosário', status: 'falta_manutencao' },
      { bairro: 'Antônio Dias', status: 'sem_informacao' }
    ];
    
    for (const example of newStatusExamples) {
      const exists = await client.query(
        'SELECT id FROM neighborhood_status WHERE bairro = $1',
        [example.bairro]
      );
      
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO neighborhood_status (bairro, status) VALUES ($1, $2)',
          [example.bairro, example.status]
        );
        console.log(`- Adicionado: ${example.bairro} com status ${example.status}`);
      } else {
        console.log(`- ${example.bairro} já existe no banco`);
      }
    }
    
    // Verificar os status finais
    console.log('\nStatus finais no banco:');
    const finalData = await client.query('SELECT bairro, status FROM neighborhood_status ORDER BY bairro');
    finalData.rows.forEach(row => {
      console.log(`- ${row.bairro}: ${row.status}`);
    });
    
    console.log('\n✅ Atualização do schema concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a atualização
updateStatusSchema()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na atualização:', error);
    process.exit(1);
  });