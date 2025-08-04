const { Injectable, CanActivate, ExecutionContext, ForbiddenException } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { ROLES_KEY } = require('../decorators/roles.decorator');

/**
 * Guard para controle de acesso baseado em roles
 * Verifica se o usuário tem a role necessária para acessar a rota
 */
const RolesGuard = Injectable()(class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  /**
   * Determina se a requisição pode prosseguir baseado na role do usuário
   * @param {ExecutionContext} context - Contexto da execução
   * @returns {boolean}
   */
  canActivate(context) {
    // Obtém as roles necessárias definidas no decorator @Roles
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se não há roles definidas, permite o acesso
    if (!requiredRoles) {
      return true;
    }

    // Obtém o usuário da requisição
    const { user } = context.switchToHttp().getRequest();

    // Verifica se o usuário existe
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verifica se o usuário tem alguma das roles necessárias
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}. Sua role: ${user.role}`,
      );
    }

    return true;
  }
});

module.exports = { RolesGuard };