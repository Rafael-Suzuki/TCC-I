const { Module } = require('@nestjs/common');
const { LoggingInterceptor } = require('./interceptors/logging.interceptor');
const { ValidationPipe } = require('./pipes/validation.pipe');
const { HttpExceptionFilter } = require('./filters/http-exception.filter');
const { ResponseInterceptor } = require('./interceptors/response.interceptor');

/**
 * Módulo comum com utilitários compartilhados
 */
const CommonModule = Module({
  providers: [
    LoggingInterceptor,
    ResponseInterceptor,
    HttpExceptionFilter,
    ValidationPipe,
  ],
  exports: [
    LoggingInterceptor,
    ResponseInterceptor,
    HttpExceptionFilter,
    ValidationPipe,
  ],
})(class CommonModule {});

module.exports = { CommonModule };