const { Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { SequelizeModule } = require('@nestjs/sequelize');
const { AuthModule } = require('./auth/auth.module');
const { UsersModule } = require('./users/users.module');
const { StatusModule } = require('./status/status.module');
const { DatabaseModule } = require('./database/database.module');
const { AppController } = require('./app.controller');
const { AppService } = require('./app.service');

/**
 * Módulo principal da aplicação
 * Configura todos os módulos, banco de dados e variáveis de ambiente
 */
const AppModule = Module({
  imports: [
    // Configuração de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true, // Torna as configurações disponíveis globalmente
      envFilePath: '.env', // Caminho do arquivo .env
    }),

    // Configuração do banco de dados PostgreSQL com Sequelize
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'water_monitoring',
      autoLoadModels: true, // Carrega automaticamente os modelos
      synchronize: process.env.NODE_ENV === 'development', // Sincroniza apenas em desenvolvimento
      logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log apenas em desenvolvimento
    }),

    // Módulos da aplicação
    DatabaseModule,
    AuthModule,
    UsersModule,
    StatusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})(class AppModule {});

module.exports = { AppModule };