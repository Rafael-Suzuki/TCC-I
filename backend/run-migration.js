const { Sequelize } = require('sequelize');
const fs = require('fs');
require('dotenv').config();

/**
 * Script para executar migração de coordenadas
 */
async function runMigration() {
  let sequelize = null;
  
  try {
    // Verificar se deve conectar ao banco
    const shouldConnectDB = process.env.ENABLE_DATABASE === 'true';
    
    if (!shouldConnectDB) {
      console.log('⚠️  Banco de dados desabilitado via configuração ENABLE_DATABASE.');
      console.log('Para executar a migração, defina ENABLE_DATABASE=true no arquivo .env');
      return;
    }

    // Configuração da conexão
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'monitor_agua',
      logging: console.log,
    });

    // Testar conexão
    console.log('🔄 Testando conexão com o banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Ler arquivo de migração
    console.log('📄 Lendo arquivo de migração...');
    const migrationPath = './database/migrations/2025_08_add_coords_to_status.sql';
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Arquivo de migração carregado!');

    // Executar migração
    console.log('🔄 Executando migração...');
    await sequelize.query(migrationSQL);
    console.log('✅ Migração executada com sucesso!');
    
    // Verificar se as colunas foram criadas
    console.log('🔍 Verificando estrutura da tabela...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'neighborhood_status' 
      AND column_name IN ('latitude', 'longitude')
      ORDER BY column_name;
    `);
    
    if (results.length === 2) {
      console.log('✅ Colunas de coordenadas criadas com sucesso:');
      results.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('⚠️  Algumas colunas podem não ter sido criadas corretamente.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n💡 Dicas para resolver problemas de conexão:');
      console.log('1. Verifique se o PostgreSQL está rodando');
      console.log('2. Confirme as configurações no arquivo .env');
      console.log('3. Verifique se o banco de dados existe');
    }
    
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Conexão com banco fechada.');
    }
  }
}

// Executar migração
runMigration();