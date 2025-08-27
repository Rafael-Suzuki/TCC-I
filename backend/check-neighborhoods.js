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

async function checkNeighborhoods() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando correção dos bairros...');
    
    // 1. Verificar bairros existentes
    const existingResult = await client.query('SELECT bairro FROM status ORDER BY bairro');
    const existingNeighborhoods = existingResult.rows.map(row => row.bairro);
    
    console.log(`📊 Bairros existentes no banco: ${existingNeighborhoods.length}`);
    console.log(`📋 Bairros oficiais esperados: ${officialNeighborhoods.length}`);
    
    // 2. Encontrar bairros que estão no banco mas não são oficiais
    const extraNeighborhoods = existingNeighborhoods.filter(n => !officialNeighborhoods.includes(n));
    if (extraNeighborhoods.length > 0) {
      console.log('\n⚠️  Bairros extras no banco (não oficiais):');
      extraNeighborhoods.forEach(n => console.log(`   - ${n}`));
    }
    
    // 3. Encontrar bairros oficiais que não estão no banco
    const missingNeighborhoods = officialNeighborhoods.filter(n => !existingNeighborhoods.includes(n));
    if (missingNeighborhoods.length > 0) {
      console.log('\n❌ Bairros oficiais faltando no banco:');
      missingNeighborhoods.forEach(n => console.log(`   - ${n}`));
      console.log('\n⚠️  ATENÇÃO: Estes bairros devem ser adicionados manualmente por um operador/administrador.');
      console.log('   Use o sistema de administração para adicionar os bairros faltantes.');
    }
    
    // 4. Verificar total final
    const finalResult = await client.query('SELECT COUNT(*) as total FROM status');
    const finalTotal = parseInt(finalResult.rows[0].total);
    
    console.log(`\n📈 Total de bairros no banco: ${finalTotal}`);
    
    if (finalTotal === 65) {
      console.log('✅ Perfeito! Todos os 65 bairros oficiais estão no banco.');
    } else {
      console.log(`⚠️  Atenção: Esperado 65 bairros, encontrado ${finalTotal}`);
      console.log('   Para corrigir, adicione os bairros faltantes através do sistema de administração.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir bairros:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkNeighborhoods();
