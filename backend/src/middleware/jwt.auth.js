const jwt = require('jsonwebtoken');
const { database } = require('../database/database');
const { createUserModel } = require('../models/user.model');

/**
 * Middleware de autenticação JWT para Express.js
 * Verifica e valida tokens JWT nas requisições
 */

/**
 * Gera um token JWT para um usuário
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifica se um token JWT é válido
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.verify(token, secret);
}

/**
 * Middleware de autenticação obrigatória
 * Requer token válido para prosseguir
 */
function requireAuth(req, res, next) {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        error: true,
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString(),
      });
    }

    // Verificar formato: "Bearer <token>"
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>',
        error: true,
        code: 'INVALID_TOKEN_FORMAT',
        timestamp: new Date().toISOString(),
      });
    }

    const token = tokenParts[1];

    // Verificar e decodificar token
    const decoded = verifyToken(token);
    
    // Adicionar informações do usuário à requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    // Adicionar token à requisição para possível uso posterior
    req.token = token;

    next();
  } catch (error) {
    console.error('Erro na autenticação JWT:', error.message);
    
    // Tratar diferentes tipos de erro JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: true,
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: true,
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token ainda não é válido',
        error: true,
        code: 'TOKEN_NOT_ACTIVE',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Falha na autenticação',
      error: true,
      code: 'AUTH_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware de autenticação opcional
 * Adiciona informações do usuário se token válido estiver presente
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continuar sem autenticação
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return next(); // Continuar sem autenticação
    }

    const token = tokenParts[1];
    const decoded = verifyToken(token);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    req.token = token;

    next();
  } catch (error) {
    // Em caso de erro, continuar sem autenticação
    next();
  }
}

/**
 * Middleware de autorização por role
 * Requer que o usuário tenha uma das roles especificadas
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
        error: true,
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}`,
        error: true,
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Middleware para verificar se usuário é admin
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Middleware para verificar se usuário é admin ou operator
 */
function requireOperator(req, res, next) {
  return requireRole('admin', 'operator')(req, res, next);
}

/**
 * Middleware para verificar se o usuário está ativo
 * Requer consulta ao banco de dados
 */
function requireActiveUser(req, res, next) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticação necessária',
          error: true,
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        });
      }

      // Se banco estiver desabilitado, assumir que usuário está ativo
      const sequelize = database.getSequelize();
      if (!sequelize) {
        return next();
      }

      const User = createUserModel(sequelize);
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado',
          error: true,
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Conta desativada',
          error: true,
          code: 'ACCOUNT_DISABLED',
          timestamp: new Date().toISOString(),
        });
      }

      // Atualizar último login
      await user.updateLastLogin();

      next();
    } catch (error) {
      console.error('Erro ao verificar usuário ativo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno na verificação de usuário',
        error: true,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware para verificar se usuário pode acessar recurso próprio
 * Permite acesso se for admin ou se for o próprio usuário
 */
function requireOwnershipOrAdmin(userIdParam = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
        error: true,
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString(),
      });
    }

    const targetUserId = req.params[userIdParam];
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.id === targetUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode acessar seus próprios recursos',
        error: true,
        code: 'ACCESS_DENIED',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Função para fazer login e gerar token
 */
async function loginUser(email, password) {
  try {
    const sequelize = database.getSequelize();
    
    // Se banco estiver desabilitado, usar dados mock
    if (!sequelize) {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Usuário Mock',
        email: email,
        role: 'admin',
        isActive: true,
      };
      
      // Simular validação de senha
      if (password === 'admin123') {
        const token = generateToken(mockUser);
        return { user: mockUser, token };
      } else {
        throw new Error('Credenciais inválidas');
      }
    }

    const User = createUserModel(sequelize);
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new Error('Conta desativada');
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Atualizar último login
    await user.updateLastLogin();

    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireOperator,
  requireActiveUser,
  requireOwnershipOrAdmin,
  loginUser,
};