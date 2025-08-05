const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

/**
 * Modelo User para o sistema de monitoramento de água
 * Define a estrutura da tabela de usuários
 */
function createUserModel(sequelize) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome é obrigatório',
        },
        len: {
          args: [2, 100],
          msg: 'Nome deve ter entre 2 e 100 caracteres',
        },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: {
        name: 'unique_email',
        msg: 'Este email já está em uso',
      },
      validate: {
        isEmail: {
          msg: 'Email deve ter um formato válido',
        },
        notEmpty: {
          msg: 'Email é obrigatório',
        },
      },
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Senha é obrigatória',
        },
        len: {
          args: [6, 255],
          msg: 'Senha deve ter pelo menos 6 caracteres',
        },
      },
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user',
      allowNull: false,
      validate: {
        isIn: {
          args: [['admin', 'user']],
          msg: 'Role deve ser admin ou user',
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
    ],
    hooks: {
      // Hash da senha antes de salvar
      beforeCreate: async (user) => {
        if (user.senha) {
          const saltRounds = 12;
          user.senha = await bcrypt.hash(user.senha, saltRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('senha')) {
          const saltRounds = 12;
          user.senha = await bcrypt.hash(user.senha, saltRounds);
        }
      },
    },
  });

  // Métodos de instância
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.senha);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.senha; // Nunca retornar a senha
    return values;
  };



  // Métodos estáticos
  User.findByEmail = async function(email) {
    return await this.findOne({
      where: { email: email.toLowerCase() },
    });
  };

  User.findActiveUsers = async function() {
    return await this.findAll({
      order: [['createdAt', 'DESC']],
    });
  };

  User.createUser = async function(userData) {
    const { name, email, password, role = 'user' } = userData;
    
    return await this.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });
  };

  return User;
}

module.exports = {
  createUserModel,
};