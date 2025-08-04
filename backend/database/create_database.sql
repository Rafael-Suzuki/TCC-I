-- Script para criação do banco de dados PostgreSQL
-- Sistema de Monitoramento de Água

-- Conectar como superusuário postgres
-- psql -U postgres

-- Criar o banco de dados
CREATE DATABASE monitor_agua
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TEMPLATE = template0;

-- Comentário do banco
COMMENT ON DATABASE monitor_agua IS 'Sistema de Monitoramento de Água - João Monlevade';

-- Conectar ao banco criado
\c monitor_agua;

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verificar se o banco foi criado corretamente
SELECT current_database(), current_user, version();

PRINT 'Banco de dados monitor_agua criado com sucesso!';
PRINT 'Execute o script de inicialização das tabelas em seguida.';