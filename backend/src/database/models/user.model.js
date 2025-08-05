const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Modelo de usuário para autenticação e autorização
 * Representa a tabela 'users' no banco de dados
 */
function createUserModel(sequelize) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.senha) {
          user.senha = await bcrypt.hash(user.senha, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('senha')) {
          user.senha = await bcrypt.hash(user.senha, 12);
        }
      },
    },
  });

  /**
   * Valida a senha do usuário
   */
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.senha);
  };

  /**
   * Remove a senha do objeto JSON
   */
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.senha;
    return values;
  };

  return User;
}

module.exports = { createUserModel };