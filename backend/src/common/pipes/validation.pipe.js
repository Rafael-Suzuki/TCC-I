const { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } = require('@nestjs/common');
const { validate } = require('class-validator');
const { plainToClass } = require('class-transformer');

/**
 * Pipe customizado para validação de dados
 */
const ValidationPipe = Injectable()(class ValidationPipe {
  async transform(value, { metatype }) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Dados de entrada inválidos',
        errors: errorMessages,
      });
    }

    return value;
  }

  /**
   * Verifica se o tipo deve ser validado
   */
  toValidate(metatype) {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Formata os erros de validação
   */
  formatErrors(errors) {
    const formattedErrors = {};

    errors.forEach(error => {
      const property = error.property;
      const constraints = error.constraints;
      
      if (constraints) {
        formattedErrors[property] = Object.values(constraints);
      }

      // Tratar erros aninhados
      if (error.children && error.children.length > 0) {
        formattedErrors[property] = this.formatNestedErrors(error.children);
      }
    });

    return formattedErrors;
  }

  /**
   * Formata erros de validação aninhados
   */
  formatNestedErrors(children) {
    const nestedErrors = {};

    children.forEach(child => {
      const property = child.property;
      const constraints = child.constraints;
      
      if (constraints) {
        nestedErrors[property] = Object.values(constraints);
      }

      if (child.children && child.children.length > 0) {
        nestedErrors[property] = this.formatNestedErrors(child.children);
      }
    });

    return nestedErrors;
  }
});

module.exports = { ValidationPipe };