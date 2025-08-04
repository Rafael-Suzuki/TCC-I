# Sistema de Monitoramento de Fornecimento de Água - João Monlevade

## Descrição do Projeto

Aplicação web full-stack para monitoramento em tempo real do status do abastecimento de água nos bairros da cidade de João Monlevade - MG, utilizando mapas interativos.

### Tecnologias Utilizadas

- **Frontend**: Next.js (JavaScript)
- **Backend**: NestJS (JavaScript)
- **Banco de Dados**: PostgreSQL
- **Mapas**: React-Leaflet
- **Autenticação**: JWT
- **Containerização**: Docker

## Estrutura do Projeto

```
projeto-tcc-i/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   └── Dockerfile
├── infra/
│   ├── docker-compose.yml
│   └── postgres-data/
├── seed-data/
└── README.md
```

## Instalação e Execução

### Pré-requisitos

- Node.js (versão 18 ou superior)
- Docker e Docker Compose
- PostgreSQL (se executar sem Docker)

### Execução Local

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd projeto-tcc-i
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure as variáveis de ambiente no .env
   npm run start:dev
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Execução com Docker

1. **Executar todos os serviços**
   ```bash
   cd infra
   docker-compose up --build
   ```

2. **Acessar a aplicação**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Funcionalidades

### Mapa Interativo
- Visualização dos bairros de João Monlevade
- Status de fornecimento por cores:
  - 🔵 Azul: Fornecimento OK
  - 🟡 Amarelo: Em Manutenção
  - 🔴 Vermelho: Desabastecido
  - ⚪ Cinza: Sem Informação
- Busca por bairros e ruas
- Tooltips informativos

### Sistema de Autenticação
- Login com JWT
- Controle de acesso por roles (admin/operador)

### Dashboard Administrativo
- CRUD de status dos bairros
- Gerenciamento de usuários (admin)

## API Endpoints

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro (admin apenas)

### Status dos Bairros
- `GET /status` - Listar status
- `POST /status` - Criar status
- `PUT /status/:id` - Atualizar status
- `DELETE /status/:id` - Remover status

### Usuários
- `GET /users` - Listar usuários (admin)
- `POST /users` - Criar usuário (admin)
- `PUT /users/:id` - Atualizar usuário (admin)
- `DELETE /users/:id` - Deletar usuário (admin)

## Banco de Dados

### Tabelas

**Users**
- id (SERIAL PRIMARY KEY)
- nome (VARCHAR)
- email (VARCHAR UNIQUE)
- senha (VARCHAR)
- role (admin/operador)
- created_at (TIMESTAMP)

**NeighborhoodStatus**
- id (SERIAL PRIMARY KEY)
- bairro (VARCHAR)
- status (ok/manutencao/desabastecido/sem_info)
- updated_at (TIMESTAMP)

## Desenvolvimento

### Comandos Úteis

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar testes
npm test

# Docker
docker-compose up --build
docker-compose down
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.