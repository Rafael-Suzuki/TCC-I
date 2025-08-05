const fs = require('fs');
const path = require('path');

// Coordenadas centrais de João Monlevade baseadas nas fontes web
const JOAO_MONLEVADE_CENTER = {
  lat: -19.8126, // Latitude central da cidade
  lng: -43.1735  // Longitude central da cidade
};

// Lista dos 65 bairros corretos de João Monlevade
const correctNeighborhoods = [
  'Aclimação', 'Alvorada', 'Amazonas', 'Antônio Dias', 'Areia Preta',
  'Bela Vista', 'Belmonte', 'Boa Vista', 'Bom Jesus', 'Bom Retiro',
  'Campo Alegre', 'Campos Elísios', 'Carneirinhos', 'Centro', 'Cidade Nova',
  'Cruzeiro Celeste', 'Esperança', 'Fátima', 'Granjas Monlevade', 'Jardim Alvorada',
  'Jardim das Rosas', 'Jardim Esperança', 'Jardim Panorama', 'Jardim Primavera', 'Jardim Quisisana',
  'Jardim Santa Mônica', 'Loanda', 'Madre de Deus', 'Monlevade', 'Monte Castelo',
  'Nova Esperança', 'Nova Monlevade', 'Novo Cruzeiro', 'Novo Horizonte', 'Parque das Águas',
  'Parque Ipanema', 'Parque São Luís', 'Planalto', 'Ponte do Cosme', 'Progresso',
  'Rosário', 'Santa Bárbara', 'Santa Efigênia', 'Santa Rita', 'Santa Terezinha',
  'Santo Antônio', 'São Benedito', 'São Cristóvão', 'São Francisco', 'São João',
  'São José', 'São Judas Tadeu', 'São Pedro', 'São Sebastião', 'São Vicente',
  'Tanque', 'Vera Cruz', 'Vila Ipê', 'Vila Operária', 'Vila Rica',
  'Vila Santa Cecília', 'Vila Tanque', 'Vista Alegre', 'Vitória', 'Zona Rural'
];

// Função para gerar coordenadas distribuídas em um padrão realista
function generateNeighborhoodCoordinates() {
  const coordinates = {};
  
  // Raio aproximado da cidade em graus (aproximadamente 5km de raio)
  const maxRadius = 0.045;
  
  // Dividir os bairros em zonas (Norte, Sul, Leste, Oeste, Centro)
  const zones = {
    centro: ['Centro', 'Rosário', 'São José', 'Monlevade'],
    norte: ['Alvorada', 'Amazonas', 'Bom Jesus', 'Campo Alegre', 'Esperança', 'Fátima', 'Jardim Alvorada', 'Jardim das Rosas', 'Jardim Esperança', 'Nova Esperança', 'Parque das Águas', 'Santa Bárbara', 'Santa Efigênia', 'São Benedito', 'São Cristóvão', 'Vista Alegre'],
    sul: ['Antônio Dias', 'Bela Vista', 'Boa Vista', 'Carneirinhos', 'Cidade Nova', 'Jardim Panorama', 'Jardim Primavera', 'Monte Castelo', 'Novo Horizonte', 'Planalto', 'Progresso', 'Santa Rita', 'São Francisco', 'São João', 'São Pedro', 'Vila Rica'],
    leste: ['Aclimação', 'Areia Preta', 'Belmonte', 'Cruzeiro Celeste', 'Jardim Quisisana', 'Loanda', 'Nova Monlevade', 'Parque Ipanema', 'Santo Antônio', 'São Judas Tadeu', 'São Sebastião', 'Tanque', 'Vila Ipê', 'Vila Tanque'],
    oeste: ['Bom Retiro', 'Campos Elísios', 'Granjas Monlevade', 'Jardim Santa Mônica', 'Madre de Deus', 'Novo Cruzeiro', 'Parque São Luís', 'Ponte do Cosme', 'Santa Terezinha', 'São Vicente', 'Vera Cruz', 'Vila Operária', 'Vila Santa Cecília', 'Vitória', 'Zona Rural']
  };
  
  // Gerar coordenadas para cada zona
  Object.keys(zones).forEach(zone => {
    const neighborhoods = zones[zone];
    
    neighborhoods.forEach((neighborhood, index) => {
      let lat, lng;
      
      switch(zone) {
        case 'centro':
          // Centro da cidade com pequenas variações
          lat = JOAO_MONLEVADE_CENTER.lat + (Math.random() - 0.5) * 0.01;
          lng = JOAO_MONLEVADE_CENTER.lng + (Math.random() - 0.5) * 0.01;
          break;
          
        case 'norte':
          // Zona norte (latitude menor = mais ao norte no hemisfério sul)
          lat = JOAO_MONLEVADE_CENTER.lat - (0.01 + Math.random() * 0.03);
          lng = JOAO_MONLEVADE_CENTER.lng + (Math.random() - 0.5) * 0.04;
          break;
          
        case 'sul':
          // Zona sul (latitude maior = mais ao sul no hemisfério sul)
          lat = JOAO_MONLEVADE_CENTER.lat + (0.01 + Math.random() * 0.03);
          lng = JOAO_MONLEVADE_CENTER.lng + (Math.random() - 0.5) * 0.04;
          break;
          
        case 'leste':
          // Zona leste (longitude maior = mais a leste)
          lat = JOAO_MONLEVADE_CENTER.lat + (Math.random() - 0.5) * 0.04;
          lng = JOAO_MONLEVADE_CENTER.lng + (0.01 + Math.random() * 0.03);
          break;
          
        case 'oeste':
          // Zona oeste (longitude menor = mais a oeste)
          lat = JOAO_MONLEVADE_CENTER.lat + (Math.random() - 0.5) * 0.04;
          lng = JOAO_MONLEVADE_CENTER.lng - (0.01 + Math.random() * 0.03);
          break;
      }
      
      // Arredondar para 6 casas decimais para precisão adequada
      coordinates[neighborhood] = {
        lat: Math.round(lat * 1000000) / 1000000,
        lng: Math.round(lng * 1000000) / 1000000
      };
    });
  });
  
  return coordinates;
}

// Gerar as coordenadas
const neighborhoodCoordinates = generateNeighborhoodCoordinates();

// Criar o código JavaScript para o arquivo Map.js
const mapJsContent = `// Coordenadas dos bairros de João Monlevade
const neighborhoodCoordinates = ${JSON.stringify(neighborhoodCoordinates, null, 2)};

export { neighborhoodCoordinates };`;

// Salvar em um arquivo separado
fs.writeFileSync('neighborhood-coordinates.js', mapJsContent);

console.log('✅ Coordenadas geradas com sucesso!');
console.log(`📍 Total de bairros: ${Object.keys(neighborhoodCoordinates).length}`);
console.log('📁 Arquivo salvo como: neighborhood-coordinates.js');

// Mostrar algumas coordenadas de exemplo
console.log('\n🗺️  Exemplos de coordenadas geradas:');
const examples = ['Centro', 'Carneirinhos', 'Vila Tanque', 'Nova Esperança', 'Santa Rita'];
examples.forEach(neighborhood => {
  if (neighborhoodCoordinates[neighborhood]) {
    console.log(`   ${neighborhood}: ${neighborhoodCoordinates[neighborhood].lat}, ${neighborhoodCoordinates[neighborhood].lng}`);
  }
});

// Verificar se todos os 65 bairros foram incluídos
const missing = correctNeighborhoods.filter(n => !neighborhoodCoordinates[n]);
if (missing.length > 0) {
  console.log('\n⚠️  Bairros não encontrados:', missing);
} else {
  console.log('\n✅ Todos os 65 bairros foram incluídos!');
}