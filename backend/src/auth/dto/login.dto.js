const { IsEmail, IsNotEmpty, IsString, MinLength } = require('class-validator');

/**
 * DTO para validação dos dados de login
 */
class LoginDto {
  /**
   * Email do usuário
   */
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email;

  /**
   * Senha do usuário
   */
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha;
}

module.exports = { LoginDto };