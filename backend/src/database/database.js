const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Configuração e inicialização do banco de dados Sequelize
 */
class Database {
  constructor() {
    this.sequelize = null;
    this.models = {};
  }

  /**
   * Inicializa a conexão com o banco de dados
   * Só conecta se ENABLE_DATABASE for 'true'
   */
  async initialize() {
    try {
      // Verificar se deve conectar ao banco
      const shouldConnectDB = process.env.ENABLE_DATABASE === 'true';
      
      if (!shouldConnectDB) {
        console.log('⚠️  Banco de dados desabilitado via configuração ENABLE_DATABASE.');
        return null;
      }

      // Configuração da conexão
      this.sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'monitor_agua',
        timezone: 'America/Sao_Paulo', // Configurar timezone para GMT-3
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
        dialectOptions: {
          timezone: 'America/Sao_Paulo', // Garantir timezone no nível do driver
        },
      });

      // Testar conexão
      await this.sequelize.authenticate();
      console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');

      return this.sequelize;
    } catch (error) {
      console.error('❌ Erro ao conectar com o banco de dados:', error.message);
      console.log('💡 Verifique as configurações no arquivo .env');
      console.log('💡 Para executar sem banco, defina ENABLE_DATABASE=false');
      throw error;
    }
  }

  /**
   * Registra um modelo no banco
   */
  registerModel(name, model) {
    this.models[name] = model;
  }

  /**
   * Retorna uma instância do modelo
   */
  getModel(modelName) {
    return this.models[modelName];
  }

  /**
   * Retorna a instância do Sequelize
   */
  getSequelize() {
    return this.sequelize;
  }

  /**
   * Sincroniza todos os modelos com o banco
   */
  async syncModels(options = {}) {
    if (!this.sequelize) {
      console.log('⚠️  Banco desabilitado, pulando sincronização.');
      return;
    }

    try {
      await this.sequelize.sync(options);
      console.log('✅ Modelos sincronizados com o banco de dados.');
    } catch (error) {
      console.error('❌ Erro ao sincronizar modelos:', error.message);
      throw error;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('🔌 Conexão com o banco de dados fechada.');
    }
  }
}

// Instância singleton
const database = new Database();

module.exports = {
  database,
  Database,
};