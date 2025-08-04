/**
 * Middleware de logging para Express.js
 * Registra informações de requisições e respostas
 */

/**
 * Gera um ID único para cada requisição
 */
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Formata o tempo de resposta em milissegundos
 */
function formatResponseTime(startTime) {
  const diff = process.hrtime(startTime);
  return (diff[0] * 1000 + diff[1] * 1e-6).toFixed(2);
}

/**
 * Middleware de logging que registra requisições HTTP
 */
function loggingInterceptor(options = {}) {
  const {
    logLevel = 'info',
    includeBody = false,
    includeHeaders = false,
    excludePaths = ['/api/health'],
    maxBodyLength = 1000,
  } = options;

  return (req, res, next) => {
    // Pular logging para caminhos excluídos
    if (excludePaths.includes(req.path)) {
      return next();
    }

    // Gerar ID único para a requisição
    const requestId = generateRequestId();
    req.requestId = requestId;

    // Marcar tempo de início
    const startTime = process.hrtime();
    const timestamp = new Date().toISOString();

    // Informações básicas da requisição
    const requestInfo = {
      requestId,
      timestamp,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    // Incluir headers se solicitado
    if (includeHeaders) {
      requestInfo.headers = req.headers;
    }

    // Incluir body se solicitado (apenas para métodos que têm body)
    if (includeBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      let body = req.body;
      if (typeof body === 'object') {
        body = JSON.stringify(body);
      }
      if (body && body.length > maxBodyLength) {
        body = body.substring(0, maxBodyLength) + '... (truncated)';
      }
      requestInfo.body = body;
    }

    // Log da requisição
    console.log(`🔵 [${logLevel.toUpperCase()}] Incoming Request:`, requestInfo);

    // Interceptar a resposta
    const originalSend = res.send;
    const originalJson = res.json;

    // Override do método send
    res.send = function(data) {
      logResponse(data);
      return originalSend.call(this, data);
    };

    // Override do método json
    res.json = function(data) {
      logResponse(data);
      return originalJson.call(this, data);
    };

    // Função para logar a resposta
    function logResponse(responseData) {
      const responseTime = formatResponseTime(startTime);
      const responseInfo = {
        requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length') || 0,
      };

      // Incluir dados da resposta se solicitado
      if (includeBody && responseData) {
        let body = responseData;
        if (typeof body === 'object') {
          body = JSON.stringify(body);
        }
        if (body && body.length > maxBodyLength) {
          body = body.substring(0, maxBodyLength) + '... (truncated)';
        }
        responseInfo.responseBody = body;
      }

      // Determinar cor do log baseado no status
      let logSymbol = '🟢';
      if (res.statusCode >= 400 && res.statusCode < 500) {
        logSymbol = '🟡';
      } else if (res.statusCode >= 500) {
        logSymbol = '🔴';
      }

      console.log(`${logSymbol} [${logLevel.toUpperCase()}] Response:`, responseInfo);

      // Log adicional para requisições lentas (> 1000ms)
      if (parseFloat(responseTime) > 1000) {
        console.warn(`⚠️  [SLOW REQUEST] ${req.method} ${req.originalUrl} took ${responseTime}ms`);
      }
    }

    // Continuar para o próximo middleware
    next();
  };
}

/**
 * Middleware simplificado para desenvolvimento
 */
function simpleLoggingInterceptor() {
  return (req, res, next) => {
    const startTime = process.hrtime();
    const timestamp = new Date().toLocaleString('pt-BR');

    console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl}`);

    // Interceptar resposta para medir tempo
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = formatResponseTime(startTime);
      const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
      
      console.log(`📤 [${new Date().toLocaleString('pt-BR')}] ${statusColor} ${res.statusCode} ${req.method} ${req.originalUrl} - ${responseTime}ms`);
      
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Middleware para logar apenas erros
 */
function errorLoggingInterceptor() {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 400) {
        console.error(`❌ [ERROR] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          body: req.body,
          response: data,
        });
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

module.exports = {
  loggingInterceptor,
  simpleLoggingInterceptor,
  errorLoggingInterceptor,
};