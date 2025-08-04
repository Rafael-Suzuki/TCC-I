const { Module } = require('@nestjs/common');
const { SequelizeModule } = require('@nestjs/sequelize');
const { User } = require('./models/user.model');
const { NeighborhoodStatus } = require('./models/neighborhood-status.model');

/**
 * Módulo de banco de dados
 * Configura os modelos Sequelize e suas relações
 */
const DatabaseModule = Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: async (configService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadModels: true,
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})(class DatabaseModule {});

module.exports = { DatabaseModule };