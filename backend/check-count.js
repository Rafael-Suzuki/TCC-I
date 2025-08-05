const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'water_monitoring',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function checkCount() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Verificando contagem de registros...');
    
    // Total de registros
    const totalResult = await client.query('SELECT COUNT(*) as total FROM status');
    console.log(`📈 Total de registros: ${totalResult.rows[0].total}`);
    
    // Contagem por status
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM status 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n📋 Distribuição por status:');
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    // Verificar se há 65 bairros únicos
    const uniqueResult = await client.query('SELECT COUNT(DISTINCT bairro) as unique_neighborhoods FROM status');
    console.log(`\n🏘️  Bairros únicos: ${uniqueResult.rows[0].unique_neighborhoods}`);
    
    if (uniqueResult.rows[0].unique_neighborhoods === '65') {
      console.log('✅ Perfeito! Temos exatamente 65 bairros únicos.');
    } else {
      console.log('⚠️  Atenção: Esperado 65 bairros únicos.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar contagem:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCount();
