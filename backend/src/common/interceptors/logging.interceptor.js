const { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } = require('@nestjs/common');
const { Observable } = require('rxjs');
const { tap } = require('rxjs/operators');

/**
 * Interceptor para logging de requisições e respostas
 */
const LoggingInterceptor = Injectable()(class LoggingInterceptor {
  constructor() {
    this.logger = new Logger(LoggingInterceptor.name);
  }

  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log da requisição
    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          this.logger.log(
            `Outgoing Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          this.logger.error(
            `Error Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Error: ${error.message}`
          );
        },
      })
    );
  }
});

module.exports = { LoggingInterceptor };