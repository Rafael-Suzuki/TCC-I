const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'monitor_agua',
  password: process.env.DB_PASS || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function cleanDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpeza de duplicatas...');
    
    // 1. Encontrar duplicatas
    const duplicatesResult = await client.query(`
      SELECT bairro, COUNT(*) as count, array_agg(id) as ids
      FROM neighborhood_status 
      GROUP BY bairro 
      HAVING COUNT(*) > 1
      ORDER BY bairro
    `);
    
    if (duplicatesResult.rows.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      return;
    }
    
    console.log(`🔍 Encontradas ${duplicatesResult.rows.length} duplicatas:`);
    
    for (const row of duplicatesResult.rows) {
      console.log(`\n📍 Bairro: ${row.bairro} (${row.count} registros)`);
      console.log(`   IDs: ${row.ids.join(', ')}`);
      
      // Manter apenas o primeiro registro (menor ID)
      const idsToDelete = row.ids.slice(1); // Remove o primeiro ID da lista
      
      if (idsToDelete.length > 0) {
        const deleteResult = await client.query(
          'DELETE FROM neighborhood_status WHERE id = ANY($1)',
          [idsToDelete]
        );
        
        console.log(`   ❌ Removidos ${deleteResult.rowCount} registros duplicados`);
        console.log(`   ✅ Mantido registro com ID: ${row.ids[0]}`);
      }
    }
    
    // 2. Verificar resultado final
    const finalCountResult = await client.query('SELECT COUNT(*) as total FROM neighborhood_status');
    const finalDuplicatesResult = await client.query(`
      SELECT COUNT(*) as duplicates 
      FROM (
        SELECT bairro 
        FROM neighborhood_status 
        GROUP BY bairro 
        HAVING COUNT(*) > 1
      ) as dup
    `);
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`   • Total de registros: ${finalCountResult.rows[0].total}`);
    console.log(`   • Duplicatas restantes: ${finalDuplicatesResult.rows[0].duplicates}`);
    
    if (finalDuplicatesResult.rows[0].duplicates === '0') {
      console.log('\n🎉 Limpeza concluída com sucesso! Nenhuma duplicata restante.');
    } else {
      console.log('\n⚠️  Ainda existem duplicatas. Execute o script novamente.');
    }
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDuplicates();
