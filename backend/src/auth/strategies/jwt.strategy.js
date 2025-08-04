const { ExtractJwt, Strategy } = require('passport-jwt');
const { PassportStrategy } = require('@nestjs/passport');
const { Injectable, UnauthorizedException } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { AuthService } = require('../auth.service');

/**
 * Estratégia JWT do Passport para validação de tokens
 */
const JwtStrategy = Injectable()(class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService, authService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'default-secret-key',
    });
    this.authService = authService;
  }

  /**
   * Método de validação chamado pelo Passport
   * @param {Object} payload - Payload do token JWT
   * @returns {Promise<User>} - Dados do usuário validado
   */
  async validate(payload) {
    try {
      // Busca o usuário pelo ID contido no token
      const user = await this.authService.findUserById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Retorna os dados do usuário que serão anexados ao request
      return {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
});

module.exports = { JwtStrategy };