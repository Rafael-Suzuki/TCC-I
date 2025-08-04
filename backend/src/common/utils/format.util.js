/**
 * Utilitários para formatação de dados
 */
class FormatUtil {
  /**
   * Formata data para o padrão brasileiro
   * @param {Date|string} date - Data a ser formatada
   * @returns {string} - Data formatada
   */
  static formatDate(date) {
    if (!date) return null;
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formata data e hora para o padrão brasileiro
   * @param {Date|string} date - Data a ser formatada
   * @returns {string} - Data e hora formatadas
   */
  static formatDateTime(date) {
    if (!date) return null;
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Formata tempo relativo (ex: "há 2 horas")
   * @param {Date|string} date - Data a ser formatada
   * @returns {string} - Tempo relativo
   */
  static formatRelativeTime(date) {
    if (!date) return null;
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'agora mesmo';
    } else if (diffMins < 60) {
      return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else {
      return this.formatDate(dateObj);
    }
  }

  /**
   * Capitaliza primeira letra de cada palavra
   * @param {string} text - Texto a ser formatado
   * @returns {string} - Texto capitalizado
   */
  static capitalizeWords(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Remove acentos de uma string
   * @param {string} text - Texto com acentos
   * @returns {string} - Texto sem acentos
   */
  static removeAccents(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Formata texto para slug (URL amigável)
   * @param {string} text - Texto a ser formatado
   * @returns {string} - Slug formatado
   */
  static toSlug(text) {
    if (!text || typeof text !== 'string') return '';
    
    return this.removeAccents(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Trunca texto com reticências
   * @param {string} text - Texto a ser truncado
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} - Texto truncado
   */
  static truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') return text;
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Formata número com separadores de milhares
   * @param {number} number - Número a ser formatado
   * @returns {string} - Número formatado
   */
  static formatNumber(number) {
    if (typeof number !== 'number') return number;
    
    return number.toLocaleString('pt-BR');
  }

  /**
   * Formata porcentagem
   * @param {number} value - Valor decimal (0-1)
   * @param {number} decimals - Casas decimais
   * @returns {string} - Porcentagem formatada
   */
  static formatPercentage(value, decimals = 1) {
    if (typeof value !== 'number') return value;
    
    return (value * 100).toFixed(decimals) + '%';
  }

  /**
   * Sanitiza string para evitar XSS
   * @param {string} text - Texto a ser sanitizado
   * @returns {string} - Texto sanitizado
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Valida e formata email
   * @param {string} email - Email a ser validado
   * @returns {string|null} - Email formatado ou null se inválido
   */
  static formatEmail(email) {
    if (!email || typeof email !== 'string') return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    
    return emailRegex.test(cleanEmail) ? cleanEmail : null;
  }
}

module.exports = { FormatUtil };