const fs = require('fs');
const path = require('path');

// Carregar coordenadas dos bairros
const coordinatesPath = path.join(__dirname, '..', 'neighborhood-coordinates.js');
const coordinatesContent = fs.readFileSync(coordinatesPath, 'utf8');

// Extrair o objeto de coordenadas
const coordinatesMatch = coordinatesContent.match(/const neighborhoodCoordinates = ({[\s\S]*?});/);
if (!coordinatesMatch) {
    console.error('❌ Não foi possível extrair as coordenadas do arquivo');
    process.exit(1);
}

const neighborhoodCoordinates = eval('(' + coordinatesMatch[1] + ')');

console.log('🗺️  VERIFICAÇÃO DE COORDENADAS DOS BAIRROS');
console.log('=' .repeat(50));

// Estatísticas
const totalCoordinates = Object.keys(neighborhoodCoordinates).length;
console.log(`📍 Total de coordenadas: ${totalCoordinates}`);

// Verificar se há coordenadas duplicadas
const coordinateStrings = Object.values(neighborhoodCoordinates).map(coord => `${coord.lat},${coord.lng}`);
const uniqueCoordinates = new Set(coordinateStrings);
const duplicateCount = coordinateStrings.length - uniqueCoordinates.size;

if (duplicateCount > 0) {
    console.log(`⚠️  Coordenadas duplicadas encontradas: ${duplicateCount}`);
    
    // Encontrar quais são duplicadas
    const coordCount = {};
    Object.entries(neighborhoodCoordinates).forEach(([name, coord]) => {
        const coordStr = `${coord.lat},${coord.lng}`;
        if (!coordCount[coordStr]) {
            coordCount[coordStr] = [];
        }
        coordCount[coordStr].push(name);
    });
    
    Object.entries(coordCount).forEach(([coordStr, names]) => {
        if (names.length > 1) {
            console.log(`   🔄 ${coordStr}: ${names.join(', ')}`);
        }
    });
} else {
    console.log('✅ Nenhuma coordenada duplicada encontrada');
}

// Verificar limites geográficos (João Monlevade)
const bounds = {
    north: -19.7,
    south: -19.9,
    east: -43.1,
    west: -43.3
};

let outsideBounds = 0;
Object.entries(neighborhoodCoordinates).forEach(([name, coord]) => {
    if (coord.lat > bounds.north || coord.lat < bounds.south || 
        coord.lng > bounds.east || coord.lng < bounds.west) {
        console.log(`⚠️  ${name} fora dos limites: ${coord.lat}, ${coord.lng}`);
        outsideBounds++;
    }
});

if (outsideBounds === 0) {
    console.log('✅ Todas as coordenadas estão dentro dos limites de João Monlevade');
} else {
    console.log(`⚠️  ${outsideBounds} coordenadas fora dos limites geográficos`);
}

// Listar alguns bairros para verificação
console.log('\n📋 Amostra de coordenadas:');
const sampleNeighborhoods = Object.entries(neighborhoodCoordinates).slice(0, 5);
sampleNeighborhoods.forEach(([name, coord]) => {
    console.log(`   • ${name}: ${coord.lat}, ${coord.lng}`);
});

console.log('\n✅ Verificação concluída!');
