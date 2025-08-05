const { Strategy } = require('passport-local');
const { PassportStrategy } = require('@nestjs/passport');
const { Injectable, UnauthorizedException } = require('@nestjs/common');
const { AuthService } = require('../auth.service');

/**
 * Estratégia local do Passport para autenticação com email e senha
 */
const LocalStrategy = Injectable()(class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super({
      usernameField: 'email', // Define que o campo de usuário é o email
      passwordField: 'senha', // Define que o campo de senha é 'senha'
    });
    this.authService = authService;
  }

  /**
   * Método de validação chamado pelo Passport
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<User>} - Dados do usuário validado
   */
  async validate(email, password) {
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    
    return user;
  }
});

module.exports = { LocalStrategy };