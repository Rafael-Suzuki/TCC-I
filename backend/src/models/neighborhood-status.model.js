const { DataTypes } = require('sequelize');

/**
 * Modelo NeighborhoodStatus para o sistema de monitoramento de água
 * Define a estrutura da tabela de status dos bairros
 */
function createNeighborhoodStatusModel(sequelize) {
  const NeighborhoodStatus = sequelize.define('NeighborhoodStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    bairro: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome do bairro é obrigatório',
        },
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'normal',
      validate: {
        isIn: {
          args: [['normal', 'intermitente', 'falta', 'manutencao']],
          msg: 'Status deve ser: normal, intermitente, falta ou manutencao',
        },
      },
    },
  }, {
    tableName: 'neighborhood_status',
    timestamps: true,
    underscored: true,
  });

  // Métodos de instância
  NeighborhoodStatus.prototype.updateStatus = async function(newStatus) {
    this.status = newStatus;
    await this.save();
  };

  // Métodos estáticos
  NeighborhoodStatus.findByNeighborhood = async function(bairro) {
    return await this.findAll({
      where: { bairro },
      order: [['createdAt', 'DESC']],
    });
  };

  NeighborhoodStatus.findByStatus = async function(status) {
    return await this.findAll({
      where: { status },
      order: [['createdAt', 'DESC']],
    });
  };

  NeighborhoodStatus.getStatusSummary = async function() {
    const summary = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    return summary.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});
  };

  NeighborhoodStatus.createReport = async function(reportData) {
    const { bairro, status } = reportData;

    return await this.create({
      bairro: bairro.trim(),
      status,
    });
  };

  return NeighborhoodStatus;
}

module.exports = {
  createNeighborhoodStatusModel,
};