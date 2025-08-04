const bcrypt = require('bcrypt');

/**
 * Utilitários para manipulação de senhas
 */
class PasswordUtil {
  /**
   * Gera hash da senha
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>} - Hash da senha
   */
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara senha com hash
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash armazenado
   * @returns {Promise<boolean>} - True se a senha confere
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Valida força da senha
   * @param {string} password - Senha a ser validada
   * @returns {Object} - Resultado da validação
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: true,
      score: 0,
      feedback: [],
    };

    // Verificar comprimento mínimo
    if (password.length < 8) {
      result.isValid = false;
      result.feedback.push('Senha deve ter pelo menos 8 caracteres');
    } else {
      result.score += 1;
    }

    // Verificar letras minúsculas
    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.feedback.push('Senha deve conter pelo menos uma letra minúscula');
    } else {
      result.score += 1;
    }

    // Verificar letras maiúsculas
    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.feedback.push('Senha deve conter pelo menos uma letra maiúscula');
    } else {
      result.score += 1;
    }

    // Verificar números
    if (!/\d/.test(password)) {
      result.isValid = false;
      result.feedback.push('Senha deve conter pelo menos um número');
    } else {
      result.score += 1;
    }

    // Verificar caracteres especiais
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.feedback.push('Recomendado: adicione caracteres especiais para maior segurança');
    } else {
      result.score += 1;
    }

    // Definir nível de força
    if (result.score <= 2) {
      result.strength = 'fraca';
    } else if (result.score <= 3) {
      result.strength = 'média';
    } else if (result.score <= 4) {
      result.strength = 'forte';
    } else {
      result.strength = 'muito forte';
    }

    return result;
  }

  /**
   * Gera senha aleatória
   * @param {number} length - Comprimento da senha
   * @returns {string} - Senha gerada
   */
  static generateRandomPassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Garantir pelo menos um caractere de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Preencher o restante aleatoriamente
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

module.exports = { PasswordUtil };