const { IsOptional, IsString, IsIn } = require('class-validator');

/**
 * DTO para atualização de status de bairro
 */
class UpdateStatusDto {
  /**
   * Nome do bairro (opcional)
   */
  @IsOptional()
  @IsString({ message: 'Nome do bairro deve ser uma string' })
  bairro;

  /**
   * Status do fornecimento de água (opcional)
   */
  @IsOptional()
  @IsString({ message: 'Status deve ser uma string' })
  @IsIn(['normal', 'intermitente', 'falta', 'sem_informacao'], {
    message: 'Status deve ser "normal", "intermitente", "falta" ou "sem_informacao"',
  })
  status;
}

module.exports = { UpdateStatusDto };