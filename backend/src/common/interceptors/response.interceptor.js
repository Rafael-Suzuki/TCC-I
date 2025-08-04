const { Injectable, NestInterceptor, ExecutionContext, CallHandler } = require('@nestjs/common');
const { Observable } = require('rxjs');
const { map } = require('rxjs/operators');

/**
 * Interceptor para padronizar respostas da API
 */
const ResponseInterceptor = Injectable()(class ResponseInterceptor {
  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        const method = request.method;
        const url = request.url;
        const timestamp = new Date().toISOString();

        // Estrutura padrão de resposta
        const standardResponse = {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          timestamp,
          path: url,
          method,
          data: data || null,
        };

        // Adicionar informações extras para diferentes tipos de resposta
        if (data && typeof data === 'object') {
          // Se for uma lista com paginação
          if (Array.isArray(data)) {
            standardResponse.count = data.length;
          }
          
          // Se for um objeto com propriedades de paginação
          if (data.hasOwnProperty('total') || data.hasOwnProperty('count')) {
            standardResponse.pagination = {
              total: data.total || data.count || 0,
              page: data.page || 1,
              limit: data.limit || data.count || 0,
            };
          }

          // Se for estatísticas
          if (data.hasOwnProperty('percentages') || data.hasOwnProperty('stats')) {
            standardResponse.type = 'statistics';
          }
        }

        // Adicionar mensagem baseada no método HTTP
        switch (method) {
          case 'POST':
            standardResponse.message = 'Recurso criado com sucesso';
            break;
          case 'PUT':
          case 'PATCH':
            standardResponse.message = 'Recurso atualizado com sucesso';
            break;
          case 'DELETE':
            standardResponse.message = 'Recurso removido com sucesso';
            break;
          case 'GET':
            standardResponse.message = 'Dados recuperados com sucesso';
            break;
          default:
            standardResponse.message = 'Operação realizada com sucesso';
        }

        return standardResponse;
      })
    );
  }
});

module.exports = { ResponseInterceptor };