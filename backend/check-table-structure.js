const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'monitor_agua',
  password: '231090',
  port: 5432,
});

async function checkTableStructure() {
  try {
    console.log('Conectando ao banco...');
    
    // Verificar estrutura da tabela
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'neighborhood_status' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nEstrutura da tabela neighborhood_status:');
    console.log('Coluna\t\t\tTipo\t\tNulo');
    console.log('----------------------------------------');
    
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(20)}\t${row.data_type.padEnd(15)}\t${row.is_nullable}`);
    });
    
    // Verificar alguns dados
    const dataResult = await pool.query('SELECT * FROM neighborhood_status LIMIT 3');
    console.log('\nPrimeiros 3 registros:');
    console.log(dataResult.rows);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();