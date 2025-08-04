const { IsArray, ValidateNested, IsNumber, IsString, IsIn } = require('class-validator');
const { Type } = require('class-transformer');

/**
 * DTO para item de atualização em lote
 */
class BatchUpdateItemDto {
  /**
   * ID do status a ser atualizado
   */
  @IsNumber({}, { message: 'ID deve ser um número' })
  id;

  /**
   * Novo status
   */
  @IsString({ message: 'Status deve ser uma string' })
  @IsIn(['ok', 'manutencao', 'desabastecido', 'sem_info'], {
    message: 'Status deve ser "ok", "manutencao", "desabastecido" ou "sem_info"',
  })
  status;
}

/**
 * DTO para atualização em lote de status
 */
class BatchUpdateStatusDto {
  /**
   * Array de atualizações
   */
  @IsArray({ message: 'Updates deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItemDto)
  updates;
}

module.exports = { BatchUpdateStatusDto, BatchUpdateItemDto };