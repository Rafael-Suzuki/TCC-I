// Dados de teste para os bairros
const neighborhoods = [
  { neighborhood: 'Centro', status: 'normal' },
  { neighborhood: 'Bela Vista', status: 'normal' },
  { neighborhood: 'São Sebastião', status: 'intermitente' },
  { neighborhood: 'Eldorado', status: 'normal' },
  { neighborhood: 'Caetés', status: 'sem_agua' },
  { neighborhood: 'Ponte da Aldeia', status: 'normal' },
  { neighborhood: 'Água Limpa', status: 'intermitente' },
  { neighborhood: 'Vila Rica', status: 'normal' },
  { neighborhood: 'Saramenha', status: 'sem_agua' },
  { neighborhood: 'Antônio Dias', status: 'intermitente' }
];

async function insertTestData() {
  try {
    // Primeiro, fazer login para obter o token
    const loginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'rafaelsuzuki@outlook.com.br',
        senha: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login realizado com sucesso!');
    
    // Inserir dados dos bairros
    for (const neighborhood of neighborhoods) {
      try {
        const response = await fetch('http://localhost:3001/api/status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(neighborhood)
        });
        
        if (response.ok) {
          console.log(`Bairro ${neighborhood.neighborhood} inserido com sucesso!`);
        } else if (response.status === 409) {
          console.log(`Bairro ${neighborhood.neighborhood} já existe.`);
        } else {
          const errorData = await response.json();
          console.error(`Erro ao inserir ${neighborhood.neighborhood}:`, errorData);
        }
      } catch (error) {
        console.error(`Erro ao inserir ${neighborhood.neighborhood}:`, error.message);
      }
    }
    
    console.log('\nDados de teste inseridos com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

insertTestData();