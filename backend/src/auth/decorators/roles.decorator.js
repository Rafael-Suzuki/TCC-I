const { SetMetadata } = require('@nestjs/common');

/**
 * Chave para armazenar metadados de roles
 */
const ROLES_KEY = 'roles';

/**
 * Decorator para definir roles necessárias para acessar uma rota
 * @param {...string} roles - Lista de roles permitidas
 * @returns {Function} - Decorator function
 * 
 * @example
 * // Permite apenas administradores
 * @Roles('admin')
 * @Get('admin-only')
 * adminOnlyEndpoint() {}
 * 
 * @example
 * // Permite administradores e operadores
 * @Roles('admin', 'operador')
 * @Get('protected')
 * protectedEndpoint() {}
 */
const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);

module.exports = { Roles, ROLES_KEY };