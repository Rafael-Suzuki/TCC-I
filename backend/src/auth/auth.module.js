const { Module } = require('@nestjs/common');
const { JwtModule } = require('@nestjs/jwt');
const { PassportModule } = require('@nestjs/passport');
const { SequelizeModule } = require('@nestjs/sequelize');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { User } = require('../database/models/user.model');
const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');
const { JwtStrategy } = require('./strategies/jwt.strategy');
const { LocalStrategy } = require('./strategies/local.strategy');
const { JwtAuthGuard } = require('./guards/jwt-auth.guard');
const { RolesGuard } = require('./guards/roles.guard');

/**
 * Módulo de autenticação
 * Configura JWT, Passport e estratégias de autenticação
 */
const AuthModule = Module({
  imports: [
    // Configuração do Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Configuração do JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
    
    // Importa o modelo User
    SequelizeModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
})(class AuthModule {});

module.exports = { AuthModule };