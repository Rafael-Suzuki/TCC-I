const { IsNotEmpty, IsString, IsOptional, IsIn } = require('class-validator');

/**
 * DTO para criação de status de bairro
 */
class CreateStatusDto {
  /**
   * Nome do bairro
   */
  @IsString({ message: 'Nome do bairro deve ser uma string' })
  @IsNotEmpty({ message: 'Nome do bairro é obrigatório' })
  bairro;

  /**
   * Status do fornecimento de água
   */
  @IsOptional()
  @IsString({ message: 'Status deve ser uma string' })
  @IsIn(['normal', 'intermitente', 'falta', 'sem_informacao'], {
    message: 'Status deve ser "normal", "intermitente", "falta" ou "sem_informacao"',
  })
  status;
}

module.exports = { CreateStatusDto };