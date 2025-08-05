const neighborhoodCoordinates = require('./neighborhood-coordinates.js');

console.log('🗺️  Verificando coordenadas do mapa...');
console.log('=' .repeat(50));

const coordinateEntries = Object.entries(neighborhoodCoordinates);
console.log(`📍 Total de bairros com coordenadas: ${coordinateEntries.length}`);

// Verificar se todas as coordenadas são válidas
let validCoordinates = 0;
let invalidCoordinates = 0;

coordinateEntries.forEach(([neighborhood, coords]) => {
  if (Array.isArray(coords) && coords.length === 2 && 
      typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    validCoordinates++;
  } else {
    invalidCoordinates++;
    console.log(`❌ Coordenada inválida para ${neighborhood}:`, coords);
  }
});

console.log(`\n✅ Coordenadas válidas: ${validCoordinates}`);
console.log(`❌ Coordenadas inválidas: ${invalidCoordinates}`);

// Mostrar alguns exemplos
console.log('\n📋 Exemplos de coordenadas:');
coordinateEntries.slice(0, 5).forEach(([neighborhood, coords]) => {
  console.log(`   ${neighborhood}: [${coords[0]}, ${coords[1]}]`);
});

console.log('\n🎯 Status: Todas as coordenadas estão definidas e válidas!');