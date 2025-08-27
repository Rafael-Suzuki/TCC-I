const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { database } = require('./database/database');
const { loggingInterceptor } = require('./interceptors/logging.interceptor');
const { responseInterceptor } = require('./interceptors/response.interceptor');
const { validateBody, projectSchemas } = require('./pipes/validation.pipe');
const { loginUser } = require('./middleware/jwt.auth');

// Importar controllers
const usersController = require('./controllers/users.controller');
const statusController = require('./controllers/status.controller');
const analyticsController = require('./controllers/analytics.controller');
const analyticsInstantController = require('./controllers/analytics-instant.controller');

/**
 * Aplicação Express.js para sistema de monitoramento de água
 * Migrado do NestJS para Express com CommonJS
 */

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Configuração de middlewares de segurança
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/**
 * Configuração CORS
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * Middlewares de parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Middleware de logging
 */
app.use(loggingInterceptor({
  logLevel: 'info',
  includeBody: process.env.NODE_ENV === 'development',
  includeHeaders: false,
  excludePaths: ['/api/health'],
  maxBodyLength: 1000,
}));

/**
 * Middleware de formatação de resposta
 */
app.use(responseInterceptor({
  includeTimestamp: true,
  includeRequestId: true,
  wrapArrays: true,
  excludePaths: ['/api/health'],
}));

/**
 * Rota de health check
 */
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      enabled: process.env.ENABLE_DATABASE === 'true',
      connected: database.getSequelize() !== null,
    },
    memory: process.memoryUsage(),
  };
  
  res.json(healthInfo);
});

/**
 * Rota de autenticação
 */
app.post('/api/auth/login',
  validateBody(projectSchemas.login),
  async (req, res) => {
    try {
      const { email, senha } = req.body;
      
      const { user, token } = await loginUser(email, senha);
      
      res.success({
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      }, 'Login realizado com sucesso');
    } catch (error) {
      console.error('Erro no login:', error.message);
      
      if (error.message === 'Credenciais inválidas') {
        return res.error('Email ou senha incorretos', 401);
      }
      if (error.message === 'Conta desativada') {
        return res.error('Sua conta foi desativada', 403);
      }
      
      res.error('Erro interno no login', 500);
    }
  }
);

/**
 * Rota para verificar token
 */
app.get('/api/auth/me', 
  require('./middleware/jwt.auth').requireAuth,
  (req, res) => {
    res.success(req.user, 'Informações do usuário');
  }
);

/**
 * Rota para logout (invalidar token no frontend)
 */
app.post('/api/auth/logout', (req, res) => {
  res.success(null, 'Logout realizado com sucesso');
});



/**
 * Montagem das rotas dos controllers
 */
app.use('/api/users', usersController);
app.use('/api/status', statusController);
app.use('/api/analytics', analyticsController);
app.use('/api/analytics-instant', analyticsInstantController);

/**
 * Rota para informações da API
 */
app.get('/api', (req, res) => {
  res.success({
    name: 'Monitor Água API',
    version: '1.0.0',
    description: 'API para monitoramento de abastecimento de água em João Monlevade',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      users: {
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        activate: 'POST /api/users/:id/activate',
      },
      status: {
        list: 'GET /api/status',
        summary: 'GET /api/status/summary',
        get: 'GET /api/status/:id',
        create: 'POST /api/status',
        update: 'PUT /api/status/:id',
        resolve: 'POST /api/status/:id/resolve',
        unresolve: 'POST /api/status/:id/unresolve',
        delete: 'DELETE /api/status/:id',
      },
    },
    database: {
      enabled: process.env.ENABLE_DATABASE === 'true',
      connected: database.getSequelize() !== null,
    },
  }, 'API do Monitor Água');
});

/**
 * Middleware para rotas não encontradas
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    error: true,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    availableRoutes: {
      api: 'GET /api',
      health: 'GET /api/health',
      auth: 'POST /api/auth/login',
      users: 'GET /api/users',
      status: 'GET /api/status',
    },
  });
});

/**
 * Middleware de tratamento de erros global
 */
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  // Erro de parsing JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido no corpo da requisição',
      error: true,
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Erro de limite de payload
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Payload muito grande',
      error: true,
      code: 'PAYLOAD_TOO_LARGE',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: true,
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        message: error.message,
        stack: error.stack,
      },
    }),
  });
});

/**
 * Função para inicializar a aplicação
 */
async function startApplication() {
  try {
    console.log('🚀 Iniciando aplicação Monitor Água...');
    
    // Inicializar banco de dados
    await database.initialize();
    
    // Sincronizar modelos se banco estiver habilitado
    if (database.getSequelize()) {
      await database.syncModels({ alter: process.env.NODE_ENV === 'development' });
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('✅ Servidor iniciado com sucesso!');
      console.log(`🌐 Servidor rodando na porta ${PORT}`);
      console.log(`📍 API disponível em: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check em: http://localhost:${PORT}/api/health`);
      console.log(`🔒 Banco de dados: ${process.env.ENABLE_DATABASE === 'true' ? 'Habilitado' : 'Desabilitado (modo mock)'}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('📚 Documentação da API disponível em: http://localhost:' + PORT + '/api');
    });
    
    // Configurar graceful shutdown
    setupGracefulShutdown(server);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

/**
 * Configuração para graceful shutdown
 */
function setupGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Recebido sinal ${signal}. Iniciando graceful shutdown...`);
    
    // Parar de aceitar novas conexões
    server.close(async () => {
      console.log('🔌 Servidor HTTP fechado.');
      
      try {
        // Fechar conexão com banco de dados
        await database.close();
        
        console.log('✅ Graceful shutdown concluído.');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro durante graceful shutdown:', error);
        process.exit(1);
      }
    });
    
    // Forçar saída após 30 segundos
    setTimeout(() => {
      console.error('⏰ Timeout no graceful shutdown. Forçando saída...');
      process.exit(1);
    }, 30000);
  };
  
  // Escutar sinais de shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Tratar erros não capturados
  process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

// Iniciar aplicação se este arquivo for executado diretamente
if (require.main === module) {
  startApplication();
}

module.exports = app;