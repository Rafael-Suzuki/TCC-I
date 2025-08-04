# Configuração do Banco de Dados PostgreSQL

## Pré-requisitos

### 1. Instalar PostgreSQL

**Windows:**
- Baixe o PostgreSQL em: https://www.postgresql.org/download/windows/
- Execute o instalador e siga as instruções
- Anote a senha do usuário `postgres` durante a instalação

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### 2. Verificar Instalação

```bash
# Verificar se o PostgreSQL está rodando
psql --version

# Conectar ao PostgreSQL (Windows)
psql -U postgres

# Conectar ao PostgreSQL (Linux/macOS)
sudo -u postgres psql
```

## Configuração do Projeto

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto backend:

```env
# Banco de dados
ENABLE_DATABASE=true

# Configurações do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=agua_ouro_preto
```

### 2. Executar Script de Configuração

```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências (se ainda não instalou)
npm install

# Executar configuração do banco
npm run db:setup
```

### 3. Verificar Configuração

O script irá:
- ✅ Criar o banco de dados `agua_ouro_preto`
- ✅ Criar as tabelas `users` e `neighborhood_status`
- ✅ Inserir dados de exemplo
- ✅ Criar usuário administrador padrão

## Usuário Administrador Padrão

```
Email: admin@aguaouropreto.com
Senha: admin123
```

**⚠️ IMPORTANTE:** Altere a senha padrão em produção!

## Estrutura do Banco

### Tabela `users`
- `id` - Chave primária (SERIAL)
- `nome` - Nome do usuário (VARCHAR)
- `email` - Email único (VARCHAR)
- `senha` - Senha hash (VARCHAR)
- `role` - Papel: 'admin' ou 'user' (VARCHAR)
- `created_at` - Data de criação (TIMESTAMP)
- `updated_at` - Data de atualização (TIMESTAMP)

### Tabela `neighborhood_status`
- `id` - Chave primária (SERIAL)
- `bairro` - Nome do bairro (VARCHAR)
- `status` - Status: 'normal', 'intermitente', 'falta' (VARCHAR)
- `created_at` - Data de criação (TIMESTAMP)
- `updated_at` - Data de atualização (TIMESTAMP)

## Comandos Úteis

### Scripts NPM
```bash
# Configurar banco pela primeira vez
npm run db:setup

# Recriar banco (apaga dados existentes)
npm run db:reset

# Iniciar aplicação
npm run start:dev
```

### Comandos PostgreSQL
```sql
-- Conectar ao banco
\c agua_ouro_preto

-- Listar tabelas
\dt

-- Ver estrutura de uma tabela
\d users

-- Consultar usuários
SELECT * FROM users;

-- Consultar status dos bairros
SELECT * FROM neighborhood_status;
```

## Solução de Problemas

### Erro de Conexão
```
ERROR: connection refused
```
**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Confirme host, porta e credenciais no `.env`
3. Teste conexão manual: `psql -h localhost -U postgres`

### Erro de Permissão
```
ERROR: permission denied to create database
```
**Solução:**
1. Use um usuário com privilégios de superusuário
2. Ou crie o banco manualmente:
   ```sql
   CREATE DATABASE agua_ouro_preto;
   GRANT ALL PRIVILEGES ON DATABASE agua_ouro_preto TO seu_usuario;
   ```

### Erro de Autenticação
```
ERROR: password authentication failed
```
**Solução:**
1. Verifique a senha no arquivo `.env`
2. Confirme o método de autenticação no `pg_hba.conf`

## Backup e Restore

### Fazer Backup
```bash
pg_dump -U postgres -h localhost agua_ouro_preto > backup.sql
```

### Restaurar Backup
```bash
psql -U postgres -h localhost agua_ouro_preto < backup.sql
```

## Próximos Passos

Após configurar o banco:
1. Execute `npm run start:dev`
2. Acesse http://localhost:3001/api/health
3. Teste as rotas da API
4. Configure o frontend para conectar à API