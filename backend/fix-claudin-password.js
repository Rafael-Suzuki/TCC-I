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

async function fixClaudinPassword() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');
    
    // Gerar hash correto para a senha 123456
    const newPassword = '123456';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('Nova senha hasheada:', hashedPassword);
    
    // Atualizar a senha do usuário
    const [results] = await sequelize.query(
      "UPDATE users SET senha = :hashedPassword WHERE email = 'claudin@operador.com'",
      {
        replacements: { hashedPassword },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log('✅ Senha atualizada com sucesso!');
    
    // Verificar se a atualização funcionou
    const [verifyResults] = await sequelize.query(
      "SELECT id, nome, email, senha, role FROM users WHERE email = 'claudin@operador.com'"
    );
    
    if (verifyResults.length > 0) {
      const user = verifyResults[0];
      console.log('\n=== Verificação ===');
      console.log('Email:', user.email);
      console.log('Nova senha hash:', user.senha);
      
      // Testar a validação
      const isValid = await bcrypt.compare('123456', user.senha);
      console.log('Validação da senha "123456":', isValid ? '✅ Válida' : '❌ Inválida');
      
      if (isValid) {
        console.log('\n🎉 Sucesso! Agora você pode fazer login com:');
        console.log('Email: claudin@operador.com');
        console.log('Senha: 123456');
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixClaudinPassword();