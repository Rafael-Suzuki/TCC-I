const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Configuração do banco usando as mesmas variáveis da aplicação
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'monitor_agua',
  logging: false
});

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');
    
    // Buscar usuário
    const [results] = await sequelize.query(
      "SELECT id, nome, email, senha, role FROM users WHERE email = 'rafaelsuzuki@outlook.com.br'"
    );
    
    if (results.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    const user = results[0];
    console.log('✅ Usuário encontrado:');
    console.log('ID:', user.id);
    console.log('Nome:', user.nome);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Senha hash:', user.senha ? 'Presente' : 'Ausente');
    console.log('Tamanho do hash:', user.senha ? user.senha.length : 0);
    
    if (user.senha) {
      // Testar validação da senha
      try {
        const isValid = await bcrypt.compare('admin123', user.senha);
        console.log('Validação da senha "admin123":', isValid ? '✅ Válida' : '❌ Inválida');
      } catch (error) {
        console.log('❌ Erro ao validar senha:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUser();