const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Script para configurar o banco de dados PostgreSQL
 */
async function setupDatabase() {
  console.log('🔧 Iniciando configuração do banco de dados...');

  // Configuração de conexão para criar o banco
  const adminConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Conectar ao banco padrão primeiro
  };

  const dbName = process.env.DB_NAME || 'agua_ouro_preto';
  let client;

  try {
    // Conectar como admin para criar o banco
    console.log('📡 Conectando ao PostgreSQL...');
    client = new Client(adminConfig);
    await client.connect();

    // Verificar se o banco já existe
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1;
    `;
    const dbExists = await client.query(checkDbQuery, [dbName]);

    if (dbExists.rows.length === 0) {
      // Criar o banco de dados
      console.log(`🗄️  Criando banco de dados '${dbName}'...`);
      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log('✅ Banco de dados criado com sucesso!');
    } else {
      console.log(`ℹ️  Banco de dados '${dbName}' já existe.`);
    }

    await client.end();

    // Conectar ao banco específico para executar o script de inicialização
    console.log('📋 Executando script de inicialização...');
    const appConfig = {
      ...adminConfig,
      database: dbName,
    };

    client = new Client(appConfig);
    await client.connect();

    // Ler e executar o script SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('PRINT'));

    for (const command of commands) {
      if (command.trim()) {
        try {
          await client.query(command);
        } catch (error) {
          // Ignorar erros de objetos que já existem
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Aviso ao executar comando: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Script de inicialização executado com sucesso!');

    // Verificar se as tabelas foram criadas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    const tables = await client.query(tablesQuery);
    
    console.log('📊 Tabelas criadas:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    await client.end();

    console.log('🎉 Configuração do banco de dados concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verifique as configurações no arquivo .env');
    console.log('   2. Execute: npm run start:dev');
    console.log('   3. Acesse: http://localhost:3001/api/health');
    console.log('\n👤 Usuário administrador padrão:');
    console.log('   Email: admin@aguaouropreto.com');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error.message);
    console.log('\n🔍 Possíveis soluções:');
    console.log('   1. Verifique se o PostgreSQL está rodando');
    console.log('   2. Confirme as credenciais no arquivo .env');
    console.log('   3. Certifique-se que o usuário tem permissões para criar bancos');
    process.exit(1);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (error) {
        // Ignorar erros ao fechar conexão
      }
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };