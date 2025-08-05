const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'water_monitoring',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

// Lista dos 65 bairros oficiais de João Monlevade
const officialNeighborhoods = [
  'Alvorada', 'Areal', 'Barreiro', 'Boa Vista', 'Bom Jesus', 'Bonfim',
  'Caetés', 'Camargos', 'Centro', 'Cidade Nova', 'Cruzeiro do Sul',
  'Esplanada', 'Fátima', 'Funcionários', 'Granjas', 'Havaí',
  'Industrial', 'Jardim dos Ipês', 'João Paulo II', 'José Moreira dos Santos',
  'Lajinha', 'Liberdade', 'Loanda', 'Mangabeiras', 'Marajoara',
  'Melo Viana', 'Minas Caixa', 'Monlevade', 'Monte Castelo', 'Montese',
  'Novo Horizonte', 'Olaria', 'Palmital', 'Parque das Águas', 'Parque São Luís',
  'Pedreira', 'Planalto', 'Ponte do Cosme', 'Progresso', 'Rosário',
  'Santa Bárbara', 'Santa Efigênia', 'Santa Helena', 'Santa Mônica',
  'Santa Rita', 'Santa Terezinha', 'Santo Antônio', 'São Cristóvão',
  'São Francisco', 'São João', 'São José', 'São Judas Tadeu',
  'São Pedro', 'São Sebastião', 'São Vicente', 'Tanque', 'Tijuco',
  'Tomé', 'Triângulo', 'Universitário', 'Vale do Aço', 'Vale Verde',
  'Vila Bretas', 'Vila Tanque', 'Vitória'
];

async function analyzeNeighborhoods() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ANÁLISE DETALHADA DOS BAIRROS');
    console.log('=' .repeat(50));
    
    // 1. Estatísticas gerais
    const totalResult = await client.query('SELECT COUNT(*) as total FROM status');
    const statusResult = await client.query(
      'SELECT status, COUNT(*) as count FROM status GROUP BY status ORDER BY count DESC'
    );
    
    console.log(`📊 Total de registros no banco: ${totalResult.rows[0].total}`);
    console.log(`📋 Total de bairros oficiais: ${officialNeighborhoods.length}`);
    
    console.log('\n📈 Distribuição por status:');
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} bairros`);
    });
    
    // 2. Verificar bairros existentes
    const existingResult = await client.query('SELECT bairro FROM status ORDER BY bairro');
    const existingNeighborhoods = existingResult.rows.map(row => row.bairro);
    
    // 3. Comparação com lista oficial
    const missingFromDB = officialNeighborhoods.filter(n => !existingNeighborhoods.includes(n));
    const extraInDB = existingNeighborhoods.filter(n => !officialNeighborhoods.includes(n));
    
    if (missingFromDB.length > 0) {
      console.log('\n❌ Bairros oficiais FALTANDO no banco:');
      missingFromDB.forEach(n => console.log(`   - ${n}`));
    } else {
      console.log('\n✅ Todos os bairros oficiais estão no banco');
    }
    
    if (extraInDB.length > 0) {
      console.log('\n⚠️  Bairros EXTRAS no banco (não oficiais):');
      extraInDB.forEach(n => console.log(`   - ${n}`));
    } else {
      console.log('\n✅ Nenhum bairro extra encontrado');
    }
    
    // 4. Verificar duplicatas
    const duplicatesResult = await client.query(
      'SELECT bairro, COUNT(*) as count FROM status GROUP BY bairro HAVING COUNT(*) > 1'
    );
    
    if (duplicatesResult.rows.length > 0) {
      console.log('\n🔄 Bairros DUPLICADOS encontrados:');
      duplicatesResult.rows.forEach(row => {
        console.log(`   - ${row.bairro}: ${row.count} registros`);
      });
    } else {
      console.log('\n✅ Nenhuma duplicata encontrada');
    }
    
    // 5. Listar todos os bairros do banco
    console.log('\n📋 Todos os bairros no banco:');
    existingNeighborhoods.forEach((neighborhood, index) => {
      const isOfficial = officialNeighborhoods.includes(neighborhood);
      const marker = isOfficial ? '✅' : '⚠️ ';
      console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${marker} ${neighborhood}`);
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RESUMO:');
    console.log(`   • Bairros no banco: ${existingNeighborhoods.length}`);
    console.log(`   • Bairros oficiais: ${officialNeighborhoods.length}`);
    console.log(`   • Faltando: ${missingFromDB.length}`);
    console.log(`   • Extras: ${extraInDB.length}`);
    console.log(`   • Duplicatas: ${duplicatesResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeNeighborhoods();
