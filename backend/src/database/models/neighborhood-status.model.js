const { DataTypes } = require('sequelize');

/**
 * Modelo para status dos bairros
 * Representa a tabela 'neighborhood_status' no banco de dados
 */
function createNeighborhoodStatusModel(sequelize) {
  const NeighborhoodStatus = sequelize.define('NeighborhoodStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bairro: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('normal', 'intermitente', 'intermitente_manutencao', 'falta', 'falta_manutencao', 'sem_informacao'),
      allowNull: false,
      defaultValue: 'sem_informacao',
    },
  }, {
    tableName: 'neighborhood_status',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: async (neighborhoodStatus) => {
        neighborhoodStatus.updated_at = new Date();
      },
    },
  });

  /**
   * Retorna a descrição do status
   */
  NeighborhoodStatus.prototype.getStatusDescription = function() {
    const descriptions = {
      normal: 'Normal',
      intermitente: 'Intermitente',
      intermitente_manutencao: 'Intermitente em Manutenção',
      falta: 'Sem Água',
      falta_manutencao: 'Sem Água em Manutenção',
      sem_informacao: 'Sem Informação',
    };
    return descriptions[this.status] || 'Status desconhecido';
  };

  /**
   * Retorna a cor do status para exibição
   */
  NeighborhoodStatus.prototype.getStatusColor = function() {
    const colors = {
      normal: '#3b82f6', // Azul
      intermitente: '#f59e0b', // Laranja
      intermitente_manutencao: '#f59e0b', // Laranja
      falta: '#ef4444', // Vermelho
      falta_manutencao: '#ef4444', // Vermelho
      sem_informacao: '#6b7280', // Cinza
    };
    return colors[this.status] || '#6b7280';
  };

  /**
   * Serialização customizada
   */
  NeighborhoodStatus.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return {
      ...values,
      statusDescription: this.getStatusDescription(),
      statusColor: this.getStatusColor(),
    };
  };

  return NeighborhoodStatus;
}

module.exports = { createNeighborhoodStatusModel };