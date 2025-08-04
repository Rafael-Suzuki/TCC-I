const { Injectable, ExecutionContext } = require('@nestjs/common');
const { AuthGuard } = require('@nestjs/passport');
const { Observable } = require('rxjs');

/**
 * Guard para autenticação JWT
 * Utiliza a estratégia JWT do Passport
 */
const JwtAuthGuard = Injectable()(class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Determina se a requisição pode prosseguir
   * @param {ExecutionContext} context - Contexto da execução
   * @returns {boolean | Promise<boolean> | Observable<boolean>}
   */
  canActivate(context) {
    // Chama o método pai para validar o token JWT
    return super.canActivate(context);
  }

  /**
   * Manipula requisições não autorizadas
   * @param {any} err - Erro de autenticação
   * @param {any} user - Dados do usuário (se disponível)
   * @param {any} info - Informações adicionais
   * @returns {any}
   */
  handleRequest(err, user, info) {
    // Se houver erro ou usuário não encontrado, lança exceção
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido');
    }
    return user;
  }
});

module.exports = { JwtAuthGuard };