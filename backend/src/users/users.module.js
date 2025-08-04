const { Module } = require('@nestjs/common');
const { SequelizeModule } = require('@nestjs/sequelize');
const { User } = require('../database/models/user.model');
const { UsersController } = require('./users.controller');
const { UsersService } = require('./users.service');
const { AuthModule } = require('../auth/auth.module');

/**
 * Módulo de usuários
 * Gerencia CRUD de usuários (apenas para administradores)
 */
const UsersModule = Module({
  imports: [
    SequelizeModule.forFeature([User]),
    AuthModule, // Para usar guards de autenticação
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})(class UsersModule {});

module.exports = { UsersModule };