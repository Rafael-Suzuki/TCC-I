const { IsEmail, IsString, MinLength, IsOptional, IsIn } = require('class-validator');

/**
 * DTO para atualização de usuários
 */
class UpdateUserDto {
  /**
   * Nome do usuário
   */
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome;

  /**
   * Email do usuário
   */
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email;

  /**
   * Senha do usuário
   */
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
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

module.exports = { UpdateUserDto };