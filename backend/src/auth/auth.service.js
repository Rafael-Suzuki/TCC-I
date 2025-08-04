const { Injectable, UnauthorizedException, ConflictException, NotFoundException } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { InjectModel } = require('@nestjs/sequelize');
const { createUserModel } = require('../database/models/user.model');
const { database } = require('../database/database');
const bcrypt = require('bcryptjs');

/**
 * Service de autenticação
 * Contém toda a lógica de negócio para autenticação e autorização
 */
const AuthService = Injectable()(class AuthService {
  constructor(
    jwtService,
  ) {
    this.jwtService = jwtService;
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
   * Valida as credenciais do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<User|null>} - Usuário validado ou null
   */
  async validateUser(email, password) {
    try {
      // Inicializa o modelo se necessário
      this.initializeUserModel();
      
      if (!this.userModel) {
        throw new Error('Modelo User não inicializado');
      }
      
      // Busca o usuário pelo email
      const user = await this.userModel.findOne({
        where: { email },
        attributes: ['id', 'nome', 'email', 'senha', 'role', 'created_at'],
      });

      if (!user) {
        return null;
      }

      // Valida a senha
      const isPasswordValid = await bcrypt.compare(password, user.senha);
      
      if (!isPasswordValid) {
        return null;
      }

      // Remove a senha do objeto retornado
      const { senha, ...result } = user.toJSON();
      return result;
    } catch (error) {
      console.error('Erro ao validar usuário:', error);
      return null;
    }
  }

  /**
   * Realiza o login do usuário e gera o token JWT
   * @param {User} user - Dados do usuário
   * @returns {Promise<Object>} - Token e dados do usuário
   */
  async login(user) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: '24h',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Registra um novo usuário
   * @param {RegisterDto} registerDto - Dados do usuário
   * @returns {Promise<User>} - Usuário criado
   */
  async register(registerDto) {
    const { nome, email, senha, role } = registerDto;

    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }

    // Verifica se o email já existe
    const existingUser = await this.userModel.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Cria o novo usuário
    const user = await this.userModel.create({
      nome,
      email,
      senha, // A senha será criptografada automaticamente pelo hook do modelo
      role: role || 'operador',
    });

    return user;
  }

  /**
   * Busca um usuário pelo ID
   * @param {number} id - ID do usuário
   * @returns {Promise<User>} - Dados do usuário
   */
  async findUserById(id) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const user = await this.userModel.findByPk(id, {
      attributes: ['id', 'nome', 'email', 'role', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Busca um usuário pelo email
   * @param {string} email - Email do usuário
   * @returns {Promise<User>} - Dados do usuário
   */
  async findUserByEmail(email) {
    // Inicializa o modelo se necessário
    this.initializeUserModel();
    
    if (!this.userModel) {
      throw new Error('Modelo User não inicializado');
    }
    
    const user = await this.userModel.findOne({
      where: { email },
      attributes: ['id', 'nome', 'email', 'role', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Verifica se um usuário tem uma role específica
   * @param {number} userId - ID do usuário
   * @param {string} requiredRole - Role necessária
   * @returns {Promise<boolean>} - True se o usuário tem a role
   */
  async hasRole(userId, requiredRole) {
    const user = await this.findUserById(userId);
    return user.role === requiredRole;
  }

  /**
   * Verifica se um usuário é administrador
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>} - True se o usuário é admin
   */
  async isAdmin(userId) {
    return this.hasRole(userId, 'admin');
  }
});

module.exports = { AuthService };