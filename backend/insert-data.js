const { Sequelize, DataTypes } = require('sequelize');

// Configuração do banco
const sequelize = new Sequelize('monitor_agua', 'postgres', '231090', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

// Modelo NeighborhoodStatus
const NeighborhoodStatus = sequelize.define('NeighborhoodStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('normal', 'intermitente', 'falta'),
    allowNull: false,
  },
}, {
  tableName: 'neighborhood_status',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Dados de teste
const neighborhoods = [
  { bairro: 'Centro', status: 'normal' },
  { bairro: 'Bela Vista', status: 'normal' },
  { bairro: 'São Sebastião', status: 'intermitente' },
  { bairro: 'Eldorado', status: 'normal' },
  { bairro: 'Caetés', status: 'falta' },
  { bairro: 'Ponte da Aldeia', status: 'normal' },
  { bairro: 'Água Limpa', status: 'intermitente' },
  { bairro: 'Vila Rica', status: 'normal' },
  { bairro: 'Saramenha', status: 'falta' },
  { bairro: 'Antônio Dias', status: 'intermitente' }
];

async function insertData() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com banco estabelecida.');
    
    // Inserir dados
    for (const neighborhood of neighborhoods) {
      try {
        await NeighborhoodStatus.create(neighborhood);
        console.log(`Bairro ${neighborhood.bairro} inserido com sucesso!`);
      } catch (error) {
        console.error(`Erro ao inserir ${neighborhood.bairro}:`, error.message);
      }
    }
    
    console.log('\nDados inseridos com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

insertData();