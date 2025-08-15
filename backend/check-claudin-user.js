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

async function checkClaudinUser() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');
    
    // Buscar usuário claudin@operador.com
    const [results] = await sequelize.query(
      "SELECT id, nome, email, senha, role FROM users WHERE email = 'claudin@operador.com'"
    );
    
    if (results.length === 0) {
      console.log('❌ Usuário claudin@operador.com não encontrado!');
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
    console.log('Hash completo:', user.senha);
    
    if (user.senha) {
      // Testar validação da senha 123456
      try {
        const isValid = await bcrypt.compare('123456', user.senha);
        console.log('\nValidação da senha "123456":', isValid ? '✅ Válida' : '❌ Inválida');
        
        // Verificar se a senha está em texto plano (problema comum)
        if (user.senha === '123456') {
          console.log('⚠️  ATENÇÃO: Senha está em texto plano no banco!');
          console.log('A senha precisa ser hasheada corretamente.');
        } else if (user.senha.startsWith('$2b$') || user.senha.startsWith('$2a$')) {
          console.log('✅ Senha está hasheada com bcrypt');
        } else {
          console.log('⚠️  Formato de hash desconhecido');
        }
        
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

checkClaudinUser();