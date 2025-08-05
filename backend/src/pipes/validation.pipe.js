const Joi = require('joi');

/**
 * Middleware de validação usando Joi para Express.js
 * Valida req.body, req.params, req.query com schemas externos
 */

/**
 * Cria middleware de validação para diferentes partes da requisição
 */
function validationPipe(schemas = {}) {
  const { body, params, query, headers } = schemas;

  return async (req, res, next) => {
    try {
      const validationErrors = [];

      // Validar body
      if (body && req.body) {
        const { error, value } = body.validate(req.body, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });
        
        if (error) {
          validationErrors.push({
            field: 'body',
            errors: error.details.map(detail => ({
              path: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
            })),
          });
        } else {
          req.body = value; // Usar valor sanitizado
        }
      }

      // Validar params
      if (params && req.params) {
        const { error, value } = params.validate(req.params, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });
        
        if (error) {
          validationErrors.push({
            field: 'params',
            errors: error.details.map(detail => ({
              path: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
            })),
          });
        } else {
          req.params = value;
        }
      }

      // Validar query
      if (query && req.query) {
        const { error, value } = query.validate(req.query, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });
        
        if (error) {
          validationErrors.push({
            field: 'query',
            errors: error.details.map(detail => ({
              path: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
            })),
          });
        } else {
          req.query = value;
        }
      }

      // Validar headers
      if (headers && req.headers) {
        const { error } = headers.validate(req.headers, {
          abortEarly: false,
          allowUnknown: true, // Headers podem ter campos extras
        });
        
        if (error) {
          validationErrors.push({
            field: 'headers',
            errors: error.details.map(detail => ({
              path: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
            })),
          });
        }
      }

      // Se há erros de validação, retornar erro 422
      if (validationErrors.length > 0) {
        return res.status(422).json({
          success: false,
          message: 'Dados de entrada inválidos',
          error: true,
          validationErrors,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware de validação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        error: true,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware específico para validar apenas o body
 */
function validateBody(schema) {
  return validationPipe({ body: schema });
}

/**
 * Middleware específico para validar apenas os params
 */
function validateParams(schema) {
  return validationPipe({ params: schema });
}

/**
 * Middleware específico para validar apenas a query
 */
function validateQuery(schema) {
  return validationPipe({ query: schema });
}

/**
 * Schemas de validação comuns
 */
const commonSchemas = {
  // Schema para ID UUID
  uuidParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'ID deve ser um UUID válido',
      'any.required': 'ID é obrigatório',
    }),
  }),

  // Schema para ID inteiro
  integerParam: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID deve ser um número',
      'number.integer': 'ID deve ser um número inteiro',
      'number.positive': 'ID deve ser um número positivo',
      'any.required': 'ID é obrigatório',
    }),
  }),

  // Schema para paginação
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(10000).default(1000),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt'),
  }),

  // Schema para busca
  search: Joi.object({
    q: Joi.string().min(1).max(100),
    filter: Joi.string(),
  }),

  // Schema para datas
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
};

/**
 * Schemas específicos para o projeto
 */
const projectSchemas = {
  // Schema para criação de usuário
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório',
    }),
    password: Joi.string().min(6).max(255).required().messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'any.required': 'Senha é obrigatória',
    }),
    role: Joi.string().valid('admin', 'user').default('user'),
  }),

  // Schema para atualização de usuário
  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6).max(255),
    role: Joi.string().valid('admin', 'user', 'operator'),
    isActive: Joi.boolean(),
  }).min(1), // Pelo menos um campo deve ser fornecido

  // Schema para login
  login: Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().required(),
  }),

  // Schema para criação de status de bairro
  createNeighborhoodStatus: Joi.object({
    bairro: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nome do bairro deve ter pelo menos 2 caracteres',
      'string.max': 'Nome do bairro deve ter no máximo 100 caracteres',
      'any.required': 'Nome do bairro é obrigatório',
    }),
    status: Joi.string().valid('normal', 'intermitente', 'falta', 'manutencao').required(),
    description: Joi.string().max(500).allow('', null),
    priority: Joi.string().valid('baixa', 'media', 'alta', 'critica').default('media'),
    estimatedRepairTime: Joi.date().iso().greater('now'),
  }),

  // Schema para atualização de status de bairro
  updateNeighborhoodStatus: Joi.object({
    status: Joi.string().valid('normal', 'intermitente', 'falta', 'manutencao'),
    description: Joi.string().max(500).allow('', null),
    priority: Joi.string().valid('baixa', 'media', 'alta', 'critica'),
    estimatedRepairTime: Joi.date().iso(),
    isResolved: Joi.boolean(),
  }).min(1),
};

/**
 * Função auxiliar para criar validação customizada
 */
function createCustomValidation(validationFn, errorMessage = 'Validação customizada falhou') {
  return (req, res, next) => {
    try {
      const isValid = validationFn(req);
      if (!isValid) {
        return res.status(422).json({
          success: false,
          message: errorMessage,
          error: true,
          timestamp: new Date().toISOString(),
        });
      }
      next();
    } catch (error) {
      console.error('Erro na validação customizada:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        error: true,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

module.exports = {
  validationPipe,
  validateBody,
  validateParams,
  validateQuery,
  commonSchemas,
  projectSchemas,
  createCustomValidation,
};