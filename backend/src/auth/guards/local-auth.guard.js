const { Injectable } = require('@nestjs/common');
const { AuthGuard } = require('@nestjs/passport');

/**
 * Guard para autenticação local (email e senha)
 * Utiliza a estratégia local do Passport
 */
const LocalAuthGuard = Injectable()(class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context) {
    const result = (await super.canActivate(context));
    const request = context.switchToHttp().getRequest();
    await super.logIn(request);
    return result;
  }
});

module.exports = { LocalAuthGuard };