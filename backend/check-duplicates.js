const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'water_monitoring',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function checkDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando duplicatas na tabela status...');
    
    // Buscar bairros duplicados
    const result = await client.query(`
      SELECT bairro, COUNT(*) as count, array_agg(id) as ids
      FROM status 
      GROUP BY bairro 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, bairro
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
    } else {
      console.log(`⚠️  Encontradas ${result.rows.length} duplicatas:`);
      console.log('');
      
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.bairro}:`);
        console.log(`   📊 Quantidade: ${row.count} registros`);
        console.log(`   🆔 IDs: ${row.ids.join(', ')}`);
        console.log('');
      });
      
      // Estatísticas
      const totalDuplicates = result.rows.reduce((sum, row) => sum + (parseInt(row.count) - 1), 0);
      console.log(`📈 Total de registros duplicados: ${totalDuplicates}`);
      console.log(`📋 Bairros únicos afetados: ${result.rows.length}`);
    }
    
    // Verificar total geral
    const totalResult = await client.query('SELECT COUNT(*) as total FROM status');
    console.log(`\n📊 Total de registros na tabela: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar duplicatas:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDuplicates();
