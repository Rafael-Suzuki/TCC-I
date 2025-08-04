# Sistema de Monitoramento de Água - Ouro Preto

## Descrição

API Backend para sistema de monitoramento do abastecimento de água nos bairros de Ouro Preto. Este sistema permite o gerenciamento de status de fornecimento de água, autenticação de usuários e administração do sistema.

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **NestJS** - Framework para Node.js
- **PostgreSQL** - Banco de dados relacional
- **Sequelize** - ORM para PostgreSQL
- **JWT** - Autenticação via tokens
- **Bcrypt** - Hash de senhas
- **Passport** - Middleware de autenticação

## Funcionalidades

### Autenticação
- Login de usuários
- Registro de novos usuários (apenas admins)
- Validação de tokens JWT
- Controle de acesso baseado em roles (admin/operador)

### Gerenciamento de Usuários
- CRUD completo de usuários
- Diferentes níveis de acesso
- Estatísticas de usuários

### Status dos Bairros
- Cadastro e atualização de status de fornecimento
- Consulta pública de status
- Atualização em lote
- Estatísticas e relatórios
- Status disponíveis: `ok`, `manutencao`, `desabastecido`, `sem_info`

## Estrutura do Projeto

```
src/
├── auth/                 # Módulo de autenticação
│   ├── decorators/      # Decorators customizados
│   ├── dto/             # Data Transfer Objects
│   ├── guards/          # Guards de autenticação
│   └── strategies/      # Estratégias do Passport
├── common/              # Utilitários compartilhados
│   ├── filters/         # Filtros de exceção
│   ├── interceptors/    # Interceptors
│   ├── pipes/           # Pipes de validação
│   └── utils/           # Funções utilitárias
├── database/            # Configuração do banco
│   └── models/          # Modelos Sequelize
├── status/              # Módulo de status dos bairros
│   └── dto/             # DTOs do módulo
├── users/               # Módulo de usuários
│   └── dto/             # DTOs do módulo
├── app.controller.js    # Controller principal
├── app.module.js        # Módulo principal
├── app.service.js       # Service principal
└── main.js              # Arquivo de inicialização
```

## Instalação

### Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd backend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados**
   - Crie um banco PostgreSQL
   - Configure as credenciais no arquivo `.env`

4. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

5. **Execute a aplicação**
   ```bash
   # Desenvolvimento
   npm run start:dev
   
   # Produção
   npm run start:prod
   ```

## Configuração do Banco de Dados

### Variáveis de Ambiente

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=agua_ouro_preto
DB_SYNC=true
```

### Modelos

#### User
- `id` - Identificador único
- `nome` - Nome completo
- `email` - Email único
- `senha` - Senha hasheada
- `role` - Papel (admin/operador)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

#### NeighborhoodStatus
- `id` - Identificador único
- `bairro` - Nome do bairro
- `status` - Status do fornecimento
- `created_at` - Data de criação
- `updated_at` - Data de atualização

## API Endpoints

### Autenticação

```
POST /auth/login          # Login
POST /auth/register       # Registro (admin only)
GET  /auth/profile        # Perfil do usuário
POST /auth/validate       # Validar token
```

### Usuários

```
GET    /users             # Listar usuários (admin only)
GET    /users/:id         # Buscar usuário (admin only)
POST   /users             # Criar usuário (admin only)
PUT    /users/:id         # Atualizar usuário (admin only)
DELETE /users/:id         # Deletar usuário (admin only)
GET    /users/stats       # Estatísticas (admin only)
```

### Status dos Bairros

```
GET    /status            # Listar status (público)
GET    /status/:id        # Buscar por ID (público)
GET    /status/bairro/:nome # Buscar por bairro (público)
POST   /status            # Criar status (auth)
PUT    /status/:id        # Atualizar status (auth)
DELETE /status/:id        # Deletar status (admin only)
POST   /status/batch      # Atualização em lote (auth)
GET    /status/stats      # Estatísticas (público)
```

### Aplicação

```
GET    /                  # Informações da API
GET    /health            # Health check
```

## Autenticação e Autorização

### Roles

- **admin**: Acesso completo ao sistema
- **operador**: Pode atualizar status dos bairros

### Guards

- `JwtAuthGuard`: Verifica se o usuário está autenticado
- `RolesGuard`: Verifica se o usuário tem a role necessária

### Uso

```javascript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
async adminOnlyEndpoint() {
  // Apenas admins podem acessar
}
```

## Validação de Dados

O sistema utiliza `class-validator` para validação:

```javascript
class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nome;

  @IsEmail()
  email;

  @IsString()
  @MinLength(8)
  senha;
}
```

## Tratamento de Erros

Todos os erros são tratados pelo `HttpExceptionFilter` que retorna:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST",
  "error": {
    "message": "Mensagem do erro",
    "type": "Validation Error",
    "help": "Dica para resolver o erro"
  }
}
```

## Logging

O sistema registra automaticamente:
- Todas as requisições HTTP
- Erros e exceções
- Operações de banco de dados

## Scripts Disponíveis

```bash
npm run start          # Iniciar em produção
npm run start:dev      # Iniciar em desenvolvimento
npm run start:debug    # Iniciar com debug
npm run test           # Executar testes
npm run test:watch     # Testes em modo watch
npm run test:coverage  # Cobertura de testes
npm run lint           # Verificar código
npm run lint:fix       # Corrigir problemas de lint
npm run format         # Formatar código
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.