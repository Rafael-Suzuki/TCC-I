const { Injectable, NotFoundException, ConflictException } = require('@nestjs/common');
const { InjectModel } = require('@nestjs/sequelize');
const { Op } = require('sequelize');
const { createUserModel } = require('../database/models/user.model');
const { database } = require('../database/database');

/**
 * Service de usuários
 * Contém toda a lógica de negócio para gerenciamento de usuários
 */
const UsersService = Injectable()(class UsersService {
  constructor() {
    this.userModel = null;
    this.initializeUserModel();
  }

  /**
   * Inicializa o modelo User se o banco estiver disponível
   */
  initializeUserModel() {
    const sequelize = database.getSequelize();
    if (sequelize && !this.userModel) {
      this.userModel = createUserModel(sequelize);
      database.registerModel('User', this.userModel);
    }
  }

  /**
   * Listar todos os usuários com paginação e busca
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} - Lista paginada de usuários
   */
  async findAll(options = {}) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const { page = 1, limit = 10, search } = options;
    const offset = (page - 1) * limit;

    // Configurar filtros de busca
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Buscar usuários com paginação
    const { count, rows } = await this.userModel.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'nome', 'email', 'role', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Buscar usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<User>} - Dados do usuário
   */
  async findOne(id) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const user = await this.userModel.findByPk(id, {
      attributes: ['id', 'nome', 'email', 'role', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return user;
  }

  /**
   * Criar novo usuário
   * @param {CreateUserDto} createUserDto - Dados do usuário
   * @returns {Promise<User>} - Usuário criado
   */
  async create(createUserDto) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const { nome, email, senha, role } = createUserDto;

    // Verificar se o email já existe
    const existingUser = await this.userModel.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar o usuário
    const user = await this.userModel.create({
      nome,
      email,
      senha, // Será criptografada automaticamente pelo hook do modelo
      role: role || 'user',
    });

    // Retornar usuário sem a senha
    const { senha: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  /**
   * Atualizar usuário
   * @param {number} id - ID do usuário
   * @param {UpdateUserDto} updateUserDto - Dados para atualização
   * @returns {Promise<User>} - Usuário atualizado
   */
  async update(id, updateUserDto) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const user = await this.findOne(id);

    // Verificar se o email já existe (se estiver sendo alterado)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        where: {
          email: updateUserDto.email,
          id: { [Op.ne]: id }, // Excluir o próprio usuário da busca
        },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Atualizar o usuário
    await user.update(updateUserDto);

    // Retornar usuário atualizado
    return this.findOne(id);
  }

  /**
   * Deletar usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<void>}
   */
  async remove(id) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const user = await this.findOne(id);
    await user.destroy();
  }

  /**
   * Obter estatísticas de usuários
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats() {
    const totalUsers = await this.userModel.count();
    const adminUsers = await this.userModel.count({
      where: { role: 'admin' },
    });
    const operatorUsers = await this.userModel.count({
      where: { role: 'user' },
    });

    // Usuários criados nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await this.userModel.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    return {
      total: totalUsers,
      admins: adminUsers,
      operators: operatorUsers,
      recentUsers,
      distribution: {
        admin: Math.round((adminUsers / totalUsers) * 100) || 0,
        user: Math.round((operatorUsers / totalUsers) * 100) || 0,
      },
    };
  }

  /**
   * Buscar usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<User|null>} - Usuário encontrado ou null
   */
  async findByEmail(email) {
    return this.userModel.findOne({
      where: { email },
      attributes: ['id', 'nome', 'email', 'role', 'created_at', 'updated_at'],
    });
  }
});

module.exports = { UsersService };