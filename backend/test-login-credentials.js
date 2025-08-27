const axios = require('axios');

async function testLoginCredentials() {
  console.log('=== Teste de Credenciais de Login ===\n');
  
  // Credenciais baseadas no banco de dados
  const credentials = [
    { email: 'rafaelsuzuki@outlook.com.br', senha: 'admin123' },
    { email: 'admin@admin.com', senha: 'admin123' },
    { email: 'tukin@example.com', senha: 'admin123' },
    { email: 'fasfas@example.com', senha: 'admin123' },
    { email: 'teste@example.com', senha: 'admin123' },
    { email: 'joao@example.com', senha: 'admin123' },
    { email: 'maria@example.com', senha: 'admin123' },
    { email: 'cludin@example.com', senha: 'admin123' },
    { email: 'claudin@example.com', senha: 'admin123' },
    { email: 'admin@sistema.com', senha: 'admin123' }
  ];
  
  for (const cred of credentials) {
    try {
      console.log(`Testando: ${cred.email} / ${cred.senha}`);
      
      const response = await axios.post('http://localhost:3001/api/auth/login', cred, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log('✅ Login bem-sucedido!');
        console.log('Dados do usuário:', JSON.stringify(response.data.data, null, 2));
        console.log('Token obtido:', response.data.data.token ? 'Sim' : 'Não');
        console.log('\n=== CREDENCIAIS VÁLIDAS ENCONTRADAS ===');
        console.log(`Email: ${cred.email}`);
        console.log(`Senha: ${cred.senha}`);
        return;
      }
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.log(`❌ Falha: ${status} - ${message}`);
    }
  }
  
  console.log('\n❌ Nenhuma credencial funcionou.');
  console.log('\n=== Informações Adicionais ===');
  console.log('- Verifique se o backend está rodando em http://localhost:3001');
  console.log('- Verifique se o banco de dados está conectado');
  console.log('- A senha padrão do usuário administrador é "admin123"');
}

testLoginCredentials().catch(console.error);