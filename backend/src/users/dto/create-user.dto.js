const { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn } = require('class-validator');

/**
 * DTO para criação de usuários
 */
class CreateUserDto {
  /**
   * Nome do usuário
   */
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome;

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

  /**
   * Role do usuário (admin ou operador)
   */
  @IsOptional()
  @IsString({ message: 'Role deve ser uma string' })
  @IsIn(['admin', 'operador'], { message: 'Role deve ser "admin" ou "operador"' })
  role;
}

module.exports = { CreateUserDto };