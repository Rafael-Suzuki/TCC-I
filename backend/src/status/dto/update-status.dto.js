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
  @IsIn(['ok', 'manutencao', 'desabastecido', 'sem_info'], {
    message: 'Status deve ser "ok", "manutencao", "desabastecido" ou "sem_info"',
  })
  status;
}

module.exports = { UpdateStatusDto };