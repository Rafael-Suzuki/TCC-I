-- Script de inicialização do banco de dados PostgreSQL
-- Sistema de Monitoramento de Água - João Monlevade

-- Criar banco de dados (executar como superusuário)
-- CREATE DATABASE agua_ouro_preto;
-- \c agua_ouro_preto;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de status dos bairros
CREATE TABLE IF NOT EXISTS neighborhood_status (
    id SERIAL PRIMARY KEY,
    bairro VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('normal', 'intermitente', 'falta', 'manutencao')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_neighborhood_status_bairro ON neighborhood_status(bairro);
CREATE INDEX IF NOT EXISTS idx_neighborhood_status_status ON neighborhood_status(status);
CREATE INDEX IF NOT EXISTS idx_neighborhood_status_created_at ON neighborhood_status(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_neighborhood_status_updated_at ON neighborhood_status;
CREATE TRIGGER update_neighborhood_status_updated_at
    BEFORE UPDATE ON neighborhood_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário administrador padrão (senha: admin123)
-- Senha hash gerada com bcrypt para 'admin123'
INSERT INTO users (nome, email, senha, role) 
VALUES (
    'Rafael Suzuki',
    'rafaelsuzuki@outlook.com.br',
    '$2b$10$dvV.hD4xgvjwZk2H8sslT.27QNf8Qwzcc7abT7XGZE/z7CcVxno9S',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Inserir alguns bairros de exemplo
INSERT INTO neighborhood_status (bairro, status) VALUES
    ('Centro', 'normal'),
    ('Bela Vista', 'normal'),
    ('São Sebastião', 'intermitente'),
    ('Eldorado', 'normal'),
    ('Caetés', 'falta'),
    ('Ponte da Aldeia', 'normal'),
    ('Água Limpa', 'intermitente')
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE neighborhood_status IS 'Tabela de status de abastecimento de água por bairro';

COMMENT ON COLUMN users.role IS 'Papel do usuário: admin ou user';
COMMENT ON COLUMN neighborhood_status.status IS 'Status do abastecimento: normal, intermitente ou falta';

PRINT 'Banco de dados inicializado com sucesso!';