const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery, projectSchemas, commonSchemas } = require('../pipes/validation.pipe');
const { database } = require('../database/database');
const { createUserModel } = require('../models/user.model');
const { requireAuth, requireAdmin } = require('../middleware/jwt.auth');

/**
 * Controller de usuários - Express Router
 * Gerencia operações CRUD de usuários
 */
const router = express.Router();

// Inicializar modelo (será feito quando o banco estiver conectado)
let User = null;

/**
 * Inicializa o modelo User se o banco estiver disponível
 */
function initializeUserModel() {
  const sequelize = database.getSequelize();
  if (sequelize && !User) {
    User = createUserModel(sequelize);
    database.registerModel('User', User);
  }
}

/**
 * GET /api/users
 * Lista todos os usuários com paginação e filtros
 */
router.get('/', 
  requireAuth, // Middleware de autenticação
  validateQuery(Joi.object({
    ...commonSchemas.pagination.describe(),
    ...commonSchemas.search.describe(),
    role: Joi.string().valid('admin', 'user', 'operator'),
    isActive: Joi.boolean(),
  })),
  async (req, res) => {
    try {
      initializeUserModel();

      // Se banco estiver desabilitado, retornar dados mock
      if (!User) {
        const mockUsers = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Administrador',
            email: 'admin@monitoragua.com',
            role: 'admin',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'João Silva',
            email: 'joao@email.com',
            role: 'user',
            isActive: true,
            createdAt: '2024-01-16T14:30:00Z',
            updatedAt: '2024-01-16T14:30:00Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Maria Santos',
            email: 'maria@email.com',
            role: 'operator',
            isActive: true,
            createdAt: '2024-01-17T09:15:00Z',
            updatedAt: '2024-01-17T09:15:00Z',
          },
        ];

        const { page = 1, limit = 10, q, role, isActive } = req.query;
        let filteredUsers = [...mockUsers];

        // Aplicar filtros
        if (q) {
          filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(q.toLowerCase()) ||
            user.email.toLowerCase().includes(q.toLowerCase())
          );
        }
        if (role) {
          filteredUsers = filteredUsers.filter(user => user.role === role);
        }
        // Por padrão, mostrar apenas usuários ativos, a menos que especificado
        const activeFilter = isActive !== undefined ? isActive === 'true' : true;
        filteredUsers = filteredUsers.filter(user => user.isActive === activeFilter);

        // Paginação
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return res.paginated(paginatedUsers, {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit),
        });
      }

      // Lógica real com banco de dados
      const { page = 1, limit = 10, q, role, isActive, sort = 'desc', sortBy = 'createdAt' } = req.query;
      
      const whereClause = {};
      if (role) whereClause.role = role;
      // Por padrão, mostrar apenas usuários ativos, a menos que especificado
      whereClause.isActive = isActive !== undefined ? isActive === 'true' : true;
      
      // Busca por texto
      if (q) {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
        ];
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [[sortBy, sort.toUpperCase()]],
        attributes: { exclude: ['password'] }, // Nunca retornar senha
      });

      res.paginated(users.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.count,
        totalPages: Math.ceil(users.count / limit),
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.error('Erro ao buscar usuários', 500);
    }
  }
);

/**
 * GET /api/users/:id
 * Busca um usuário específico por ID
 */
router.get('/:id',
  requireAuth, // Middleware de autenticação
  validateParams(commonSchemas.integerParam),
  async (req, res) => {
    try {
      initializeUserModel();
      const { id } = req.params;

      // Se banco estiver desabilitado, retornar dados mock
      if (!User) {
        const mockUser = {
          id,
          name: 'Usuário Mock',
          email: 'mock@email.com',
          role: 'user',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        };
        return res.success(mockUser, 'Usuário encontrado');
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.error('Usuário não encontrado', 404);
      }

      res.success(user, 'Usuário encontrado');
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.error('Erro ao buscar usuário', 500);
    }
  }
);

/**
 * POST /api/users
 * Cria um novo usuário
 */
router.post('/',
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    console.log('=== BEFORE VALIDATION ===');
    console.log('Raw request body:', req.body);
    next();
  },
  validateBody(projectSchemas.createUser),
  async (req, res) => {
    try {
      initializeUserModel();
      console.log('=== AFTER VALIDATION ===');
      console.log('Request body received:', req.body);
      const { name, email, password, role } = req.body;
      console.log('Extracted fields:', { name, email, password, role });

      // Se banco estiver desabilitado, simular criação
      if (!User) {
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-' + Date.now(),
          name,
          email: email.toLowerCase(),
          role: role || 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return res.status(201).success(mockUser, 'Usuário criado com sucesso');
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.error('Email já está em uso', 409);
      }

      // Mapear campos para o modelo do banco (name->nome, password->senha)
      const userData = {
        nome: name,
        email: email.toLowerCase(),
        senha: password,
        role: role || 'user'
      };

      // Criar usuário
      const user = await User.create(userData);
      
      // Retornar usuário sem a senha
      const userResponse = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.status(201).success(userResponse, 'Usuário criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      // Tratar erros específicos do Sequelize
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.error('Email já está em uso', 409);
      }
      if (error.name === 'SequelizeValidationError') {
        return res.error('Dados inválidos', 422, error.errors);
      }
      
      res.error('Erro ao criar usuário', 500);
    }
  }
);

/**
 * PUT /api/users/:id
 * Atualiza um usuário existente
 */
router.put('/:id',
  requireAuth, requireAdmin, // Middleware de autenticação e autorização
  validateParams(commonSchemas.integerParam),
  validateBody(projectSchemas.updateUser),
  async (req, res) => {
    try {
      initializeUserModel();
      const { id } = req.params;
      const updateData = req.body;

      // Se banco estiver desabilitado, simular atualização
      if (!User) {
        const mockUser = {
          id,
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
        return res.success(mockUser, 'Usuário atualizado com sucesso');
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.error('Usuário não encontrado', 404);
      }

      // Se está atualizando email, verificar se já existe
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          return res.error('Email já está em uso', 409);
        }
      }

      await user.update(updateData);
      
      res.success(user, 'Usuário atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.error('Email já está em uso', 409);
      }
      if (error.name === 'SequelizeValidationError') {
        return res.error('Dados inválidos', 422, error.errors);
      }
      
      res.error('Erro ao atualizar usuário', 500);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Remove um usuário (soft delete)
 */
router.delete('/:id',
  requireAuth, requireAdmin, // Middleware de autenticação e autorização
  validateParams(commonSchemas.integerParam),
  async (req, res) => {
    try {
      initializeUserModel();
      const { id } = req.params;

      // Se banco estiver desabilitado, simular remoção
      if (!User) {
        return res.success(null, 'Usuário removido com sucesso');
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.error('Usuário não encontrado', 404);
      }

      // Soft delete - apenas desativar
      await user.update({ isActive: false });
      
      res.success(null, 'Usuário removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      res.error('Erro ao remover usuário', 500);
    }
  }
);

/**
 * POST /api/users/:id/activate
 * Reativa um usuário desativado
 */
router.post('/:id/activate',
  requireAuth, requireAdmin, // Middleware de autenticação e autorização
  validateParams(commonSchemas.integerParam),
  async (req, res) => {
    try {
      initializeUserModel();
      const { id } = req.params;

      if (!User) {
        return res.success(null, 'Usuário ativado com sucesso');
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.error('Usuário não encontrado', 404);
      }

      await user.update({ isActive: true });
      
      res.success(user, 'Usuário ativado com sucesso');
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      res.error('Erro ao ativar usuário', 500);
    }
  }
);

module.exports = router;