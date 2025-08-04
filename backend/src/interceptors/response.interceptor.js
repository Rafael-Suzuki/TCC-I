/**
 * Middleware de interceptação de resposta para Express.js
 * Formata todas as respostas em um padrão consistente { data, success, message }
 */

/**
 * Middleware que formata todas as respostas da API
 * Transforma respostas em formato padrão: { data, success, message, timestamp }
 */
function responseInterceptor(options = {}) {
  const {
    includeTimestamp = true,
    includeRequestId = true,
    wrapArrays = true,
    excludePaths = [],
  } = options;

  return (req, res, next) => {
    // Pular formatação para caminhos excluídos
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Salvar métodos originais
    const originalJson = res.json;
    const originalSend = res.send;

    // Override do método json
    res.json = function(data) {
      const formattedResponse = formatResponse(data, res.statusCode, req);
      return originalJson.call(this, formattedResponse);
    };

    // Override do método send
    res.send = function(data) {
      // Se já é um objeto, usar json
      if (typeof data === 'object' && data !== null) {
        return res.json(data);
      }
      
      // Para strings e outros tipos, formatar também
      const formattedResponse = formatResponse(data, res.statusCode, req);
      return originalSend.call(this, JSON.stringify(formattedResponse));
    };

    // Método auxiliar para sucesso
    res.success = function(data, message = 'Operação realizada com sucesso') {
      return res.status(200).json({
        success: true,
        message,
        data,
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
        ...(includeRequestId && req.requestId && { requestId: req.requestId }),
      });
    };

    // Método auxiliar para erro
    res.error = function(message = 'Erro interno do servidor', statusCode = 500, details = null) {
      return res.status(statusCode).json({
        success: false,
        message,
        error: true,
        ...(details && { details }),
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
        ...(includeRequestId && req.requestId && { requestId: req.requestId }),
      });
    };

    // Método auxiliar para dados paginados
    res.paginated = function(data, pagination, message = 'Dados recuperados com sucesso') {
      return res.status(200).json({
        success: true,
        message,
        data,
        pagination,
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
        ...(includeRequestId && req.requestId && { requestId: req.requestId }),
      });
    };

    // Função para formatar resposta
    function formatResponse(data, statusCode, request) {
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      // Se já está no formato esperado, retornar como está
      if (data && typeof data === 'object' && 'success' in data) {
        return {
          ...data,
          ...(includeTimestamp && !data.timestamp && { timestamp: new Date().toISOString() }),
          ...(includeRequestId && request.requestId && !data.requestId && { requestId: request.requestId }),
        };
      }

      // Determinar mensagem padrão baseada no status
      let defaultMessage;
      if (isSuccess) {
        defaultMessage = getSuccessMessage(statusCode, request.method);
      } else {
        defaultMessage = getErrorMessage(statusCode);
      }

      // Formatar resposta padrão
      const response = {
        success: isSuccess,
        message: defaultMessage,
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
        ...(includeRequestId && request.requestId && { requestId: request.requestId }),
      };

      // Adicionar dados se existirem
      if (data !== undefined && data !== null) {
        // Para arrays, verificar se deve envolver
        if (Array.isArray(data) && wrapArrays) {
          response.data = data;
          response.count = data.length;
        } else {
          response.data = data;
        }
      }

      // Para erros, adicionar campo error
      if (!isSuccess) {
        response.error = true;
        
        // Se data contém informações de erro, mover para details
        if (data && typeof data === 'object') {
          response.details = data;
          delete response.data;
        }
      }

      return response;
    }

    next();
  };
}

/**
 * Gera mensagem de sucesso baseada no status e método HTTP
 */
function getSuccessMessage(statusCode, method) {
  switch (statusCode) {
    case 200:
      return method === 'GET' ? 'Dados recuperados com sucesso' : 'Operação realizada com sucesso';
    case 201:
      return 'Recurso criado com sucesso';
    case 202:
      return 'Solicitação aceita para processamento';
    case 204:
      return 'Operação realizada com sucesso';
    default:
      return 'Operação realizada com sucesso';
  }
}

/**
 * Gera mensagem de erro baseada no status HTTP
 */
function getErrorMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return 'Dados inválidos fornecidos';
    case 401:
      return 'Acesso não autorizado';
    case 403:
      return 'Acesso proibido';
    case 404:
      return 'Recurso não encontrado';
    case 409:
      return 'Conflito de dados';
    case 422:
      return 'Dados não processáveis';
    case 429:
      return 'Muitas solicitações';
    case 500:
      return 'Erro interno do servidor';
    case 502:
      return 'Gateway inválido';
    case 503:
      return 'Serviço indisponível';
    default:
      return 'Erro na operação';
  }
}

/**
 * Middleware simplificado que apenas adiciona métodos auxiliares
 */
function simpleResponseInterceptor() {
  return (req, res, next) => {
    // Método para resposta de sucesso
    res.success = function(data, message = 'Sucesso') {
      return res.json({
        success: true,
        message,
        data,
      });
    };

    // Método para resposta de erro
    res.error = function(message = 'Erro', statusCode = 500) {
      return res.status(statusCode).json({
        success: false,
        message,
        error: true,
      });
    };

    next();
  };
}

/**
 * Middleware para APIs que precisam manter formato original
 */
function conditionalResponseInterceptor(condition) {
  return (req, res, next) => {
    if (condition(req)) {
      return responseInterceptor()(req, res, next);
    }
    next();
  };
}

module.exports = {
  responseInterceptor,
  simpleResponseInterceptor,
  conditionalResponseInterceptor,
};