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
      type: DataTypes.ENUM('ok', 'manutencao', 'desabastecido', 'sem_info'),
      allowNull: false,
      defaultValue: 'sem_info',
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
      ok: 'Fornecimento normal',
      manutencao: 'Em manutenção',
      desabastecido: 'Sem água',
      sem_info: 'Sem informação',
    };
    return descriptions[this.status] || 'Status desconhecido';
  };

  /**
   * Retorna a cor do status para exibição
   */
  NeighborhoodStatus.prototype.getStatusColor = function() {
    const colors = {
      ok: '#28a745',
      manutencao: '#ffc107',
      desabastecido: '#dc3545',
      sem_info: '#6c757d',
    };
    return colors[this.status] || '#6c757d';
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