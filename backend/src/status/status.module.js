const { Module } = require('@nestjs/common');
const { SequelizeModule } = require('@nestjs/sequelize');
const { NeighborhoodStatus } = require('../database/models/neighborhood-status.model');
const { StatusController } = require('./status.controller');
const { StatusService } = require('./status.service');
const { AuthModule } = require('../auth/auth.module');

/**
 * Módulo de status dos bairros
 * Gerencia CRUD do status de fornecimento de água
 */
const StatusModule = Module({
  imports: [
    SequelizeModule.forFeature([NeighborhoodStatus]),
    AuthModule, // Para usar guards de autenticação
  ],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})(class StatusModule {});

module.exports = { StatusModule };