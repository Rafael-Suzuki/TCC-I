const { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } = require('@nestjs/common');

/**
 * Filtro global para tratamento de exceções HTTP
 */
@Catch(HttpException)
class HttpExceptionFilter {
  constructor() {
    this.logger = new Logger(HttpExceptionFilter.name);
  }

  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException 
      ? exception.getResponse() 
      : { message: 'Erro interno do servidor' };

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: {
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : exceptionResponse.message || 'Erro desconhecido',
        details: typeof exceptionResponse === 'object' 
          ? exceptionResponse 
          : null,
      },
    };

    // Log do erro
    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} - Status: ${status} - Message: ${errorResponse.error.message}`,
      exception.stack
    );

    // Adicionar informações específicas baseadas no tipo de erro
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        errorResponse.error.type = 'Validation Error';
        errorResponse.error.help = 'Verifique os dados enviados e tente novamente';
        break;
      case HttpStatus.UNAUTHORIZED:
        errorResponse.error.type = 'Authentication Error';
        errorResponse.error.help = 'Faça login para acessar este recurso';
        break;
      case HttpStatus.FORBIDDEN:
        errorResponse.error.type = 'Authorization Error';
        errorResponse.error.help = 'Você não tem permissão para acessar este recurso';
        break;
      case HttpStatus.NOT_FOUND:
        errorResponse.error.type = 'Resource Not Found';
        errorResponse.error.help = 'O recurso solicitado não foi encontrado';
        break;
      case HttpStatus.CONFLICT:
        errorResponse.error.type = 'Conflict Error';
        errorResponse.error.help = 'Já existe um recurso com essas informações';
        break;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        errorResponse.error.type = 'Internal Server Error';
        errorResponse.error.help = 'Erro interno do servidor. Tente novamente mais tarde';
        break;
      default:
        errorResponse.error.type = 'Unknown Error';
        errorResponse.error.help = 'Ocorreu um erro inesperado';
    }

    response.status(status).json(errorResponse);
  }
}

module.exports = { HttpExceptionFilter };