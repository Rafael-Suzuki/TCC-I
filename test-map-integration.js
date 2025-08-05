const http = require('http');
const neighborhoodCoordinates = require('./neighborhood-coordinates.js');

// Function to make HTTP GET request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testMapIntegration() {
  try {
    console.log('🔍 Testing API and Map Integration...');
    
    // Test API endpoint
    console.log('\n📡 Fetching data from API...');
    const response = await makeRequest('http://localhost:3001/api/status');
    
    console.log(`✅ API Response received. Total neighborhoods: ${response.total}`);
    
    // Handle potential nested JSON string
    let neighborhoods = response.data;
    if (typeof neighborhoods === 'string') {
      try {
        const innerData = JSON.parse(neighborhoods);
        neighborhoods = innerData.data || innerData;
      } catch (e) {
        console.log('⚠️  Could not parse nested JSON, using original data');
      }
    }
    
    if (!Array.isArray(neighborhoods)) {
      throw new Error('API did not return an array of neighborhoods');
    }
    
    console.log(`\n📊 Processing ${neighborhoods.length} neighborhoods...`);
    
    // Check coordinates coverage
    const neighborhoodsWithCoordinates = [];
    const neighborhoodsWithoutCoordinates = [];
    const statusCounts = { normal: 0, intermittent: 0, missing: 0, other: 0 };
    
    neighborhoods.forEach(neighborhood => {
      const hasCoordinates = neighborhoodCoordinates[neighborhood.bairro];
      
      if (hasCoordinates) {
        neighborhoodsWithCoordinates.push(neighborhood);
      } else {
        neighborhoodsWithoutCoordinates.push(neighborhood);
      }
      
      // Count statuses
      if (statusCounts.hasOwnProperty(neighborhood.status)) {
        statusCounts[neighborhood.status]++;
      } else {
        statusCounts.other++;
      }
    });
    
    // Check for orphaned coordinates (coordinates without corresponding API data)
    const apiNeighborhoodNames = neighborhoods.map(n => n.bairro);
    const coordinateNames = Object.keys(neighborhoodCoordinates);
    const orphanedCoordinates = coordinateNames.filter(name => !apiNeighborhoodNames.includes(name));
    
    // Results
    console.log('\n📈 INTEGRATION TEST RESULTS:');
    console.log('=' .repeat(50));
    console.log(`✅ Neighborhoods with coordinates: ${neighborhoodsWithCoordinates.length}`);
    console.log(`❌ Neighborhoods without coordinates: ${neighborhoodsWithoutCoordinates.length}`);
    console.log(`🔄 Orphaned coordinates: ${orphanedCoordinates.length}`);
    
    console.log('\n📊 Status Distribution:');
    console.log(`🟢 Normal: ${statusCounts.normal}`);
    console.log(`🟡 Intermittent: ${statusCounts.intermittent}`);
    console.log(`🔴 Missing: ${statusCounts.missing}`);
    console.log(`⚪ Other: ${statusCounts.other}`);
    
    if (neighborhoodsWithoutCoordinates.length > 0) {
      console.log('\n❌ Neighborhoods missing coordinates:');
      neighborhoodsWithoutCoordinates.slice(0, 10).forEach(n => {
        console.log(`   - ${n.bairro} (${n.status})`);
      });
      if (neighborhoodsWithoutCoordinates.length > 10) {
        console.log(`   ... and ${neighborhoodsWithoutCoordinates.length - 10} more`);
      }
    }
    
    if (orphanedCoordinates.length > 0) {
      console.log('\n🔄 Orphaned coordinates (not in API):');
      orphanedCoordinates.slice(0, 10).forEach(name => {
        console.log(`   - ${name}`);
      });
      if (orphanedCoordinates.length > 10) {
        console.log(`   ... and ${orphanedCoordinates.length - 10} more`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    if (neighborhoodsWithCoordinates.length === neighborhoods.length && orphanedCoordinates.length === 0) {
      console.log('✅ Perfect integration! All neighborhoods have coordinates and no orphaned data.');
    } else if (neighborhoodsWithCoordinates.length > 0) {
      console.log(`⚠️  Partial integration: ${neighborhoodsWithCoordinates.length}/${neighborhoods.length} neighborhoods can be displayed on map.`);
    } else {
      console.log('❌ No integration: No neighborhoods can be displayed on map.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMapIntegration();