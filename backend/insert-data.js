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

// Bairros de João Monlevade - MG
const neighborhoods = [
  { bairro: 'Centro', status: 'normal' },
  { bairro: 'Aclimatação', status: 'normal' },
  { bairro: 'Alvorada', status: 'intermitente' },
  { bairro: 'Amazonas', status: 'normal' },
  { bairro: 'Areia Preta', status: 'falta' },
  { bairro: 'Baú', status: 'normal' },
  { bairro: 'Belmonte', status: 'intermitente' },
  { bairro: 'Boa Vista', status: 'normal' },
  { bairro: 'Campo Alegre', status: 'falta' },
  { bairro: 'Campos Elísios', status: 'intermitente' },
  { bairro: 'Carneirinhos', status: 'normal' },
  { bairro: 'Castelo', status: 'normal' },
  { bairro: 'Centro Industrial', status: 'intermitente' },
  { bairro: 'Cidade Nova', status: 'normal' },
  { bairro: 'Cruzeiro Celeste', status: 'falta' },
  { bairro: 'Distrito Industrial', status: 'normal' },
  { bairro: 'Ernestina Graciana', status: 'intermitente' },
  { bairro: 'Estrela Dalva', status: 'normal' },
  { bairro: 'Feixos', status: 'falta' },
  { bairro: 'Industrial', status: 'intermitente' },
  { bairro: 'Ipirangá', status: 'normal' },
  { bairro: 'Jacuí', status: 'normal' },
  { bairro: 'José de Alencar', status: 'intermitente' },
  { bairro: 'José Elói', status: 'normal' },
  { bairro: 'Laranjeiras', status: 'falta' },
  { bairro: 'Loanda', status: 'normal' },
  { bairro: 'Lourdes', status: 'intermitente' },
  { bairro: 'Lucília', status: 'normal' },
  { bairro: 'Mangabeiras', status: 'falta' },
  { bairro: 'Metalúrgico', status: 'intermitente' },
  { bairro: 'Nossa Senhora da Conceição', status: 'normal' },
  { bairro: 'Nova Aclimatação', status: 'normal' },
  { bairro: 'Nova Cachoeirinha', status: 'intermitente' },
  { bairro: 'Nova Esperança', status: 'normal' },
  { bairro: 'Nova Monlevade', status: 'falta' },
  { bairro: 'Novo Cruzeiro', status: 'normal' },
  { bairro: 'Novo Horizonte', status: 'intermitente' },
  { bairro: 'Paineiras', status: 'normal' },
  { bairro: 'Palmares', status: 'falta' },
  { bairro: 'Petrópolis', status: 'intermitente' },
  { bairro: 'Primeiro de Maio', status: 'normal' },
  { bairro: 'Promomar', status: 'normal' },
  { bairro: 'Recanto Paraíso', status: 'intermitente' },
  { bairro: 'República', status: 'normal' },
  { bairro: 'Rosário', status: 'falta' },
  { bairro: 'Santa Bárbara', status: 'normal' },
  { bairro: 'Santa Cecília', status: 'intermitente' },
  { bairro: 'Santa Cruz', status: 'normal' },
  { bairro: 'Santo Hipólito', status: 'falta' },
  { bairro: 'São Benedito', status: 'intermitente' },
  { bairro: 'São Geraldo', status: 'normal' },
  { bairro: 'São João', status: 'normal' },
  { bairro: 'São Jorge', status: 'intermitente' },
  { bairro: 'São José', status: 'normal' },
  { bairro: 'Satélite', status: 'falta' },
  { bairro: 'Serra', status: 'normal' },
  { bairro: 'Serra do Egito', status: 'intermitente' },
  { bairro: 'Sion', status: 'normal' },
  { bairro: 'Tanquinho', status: 'falta' },
  { bairro: 'Tanquinho II', status: 'intermitente' },
  { bairro: 'Teresópolis', status: 'normal' },
  { bairro: 'Vale da Serra', status: 'normal' },
  { bairro: 'Vale do Sol', status: 'intermitente' },
  { bairro: 'Vera Cruz', status: 'normal' },
  { bairro: 'Vila Tanque', status: 'falta' }
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