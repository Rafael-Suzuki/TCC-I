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

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com banco estabelecida.');
    
    const count = await NeighborhoodStatus.count();
    console.log(`Total de registros: ${count}`);
    
    const data = await NeighborhoodStatus.findAll();
    console.log('Dados encontrados:');
    data.forEach(item => {
      console.log(`- ${item.bairro}: ${item.status}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkData();