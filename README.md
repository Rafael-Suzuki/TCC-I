# 🚰 Sistema de Monitoramento de Fornecimento de Água
**João Monlevade - Minas Gerais**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Sistema web para monitoramento em tempo real do abastecimento de água nos 65 bairros de João Monlevade/MG

## ✨ Funcionalidades Principais

- 🗺️ **Mapa Interativo**: Visualização em tempo real dos 65 bairros de João Monlevade
- 🔴🟡🔵 **Status Colorido**: Sistema visual intuitivo para status de abastecimento
- 🔐 **Autenticação Segura**: Sistema de login com JWT para usuários autorizados
- 📊 **Dashboard Responsivo**: Interface adaptável para desktop e mobile
- ⚡ **Tempo Real**: Atualizações instantâneas do status de abastecimento
- 🏘️ **Cobertura Completa**: Monitoramento de todos os bairros oficiais da cidade
- 📱 **Interface Moderna**: Design clean e intuitivo com Tailwind CSS
- 🔍 **Popups Informativos**: Detalhes específicos de cada bairro no mapa

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React para produção
- **React 18** - Biblioteca para interfaces de usuário
- **React-Leaflet 4.2** - Mapas interativos
- **Leaflet 1.9** - Biblioteca de mapas JavaScript
- **Tailwind CSS 3.3** - Framework CSS utilitário
- **Axios 1.6** - Cliente HTTP
- **Heroicons 2.0** - Ícones SVG
- **js-cookie 3.0** - Manipulação de cookies

### Backend
- **Express.js 4.18** - Framework web para Node.js
- **PostgreSQL** - Banco de dados relacional
- **Sequelize 6.33** - ORM para Node.js
- **JWT 9.0** - Autenticação via tokens
- **Passport.js 0.6** - Middleware de autenticação
- **Bcrypt 5.1** - Hash de senhas
- **Helmet 7.0** - Segurança HTTP
- **Joi 17.11** - Validação de dados
- **CORS 2.8** - Cross-Origin Resource Sharing

### DevOps & Ferramentas
- **ESLint 8.0** - Linting de código
- **Prettier 5.0** - Formatação de código
- **Jest 29.5** - Framework de testes
- **Nodemon 3.0** - Desenvolvimento com hot reload
- **dotenv 16.3** - Variáveis de ambiente



## 🚀 Instalação e Execução

### Pré-requisitos
- **Node.js** 18+ 
- **PostgreSQL** 12+
- **npm** ou **yarn**

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd joao-monlevade-water-monitoring
```

### 2. Backend (Express.js)

#### Instalação
```bash
cd backend
npm install
```

#### Configuração do Banco de Dados
1. **Instale o PostgreSQL** e inicie o serviço

2. **Crie o banco de dados:**
```bash
# Usando psql
psql -U postgres
CREATE DATABASE monitor_agua;
\q

# Ou usando o script fornecido
psql -U postgres -f database/create_database.sql
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=monitor_agua
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=seu_jwt_secret
PORT=3001
```

4. **Execute a configuração inicial:**
```bash
npm run db:setup
```

#### Execução do Backend
```bash
# Desenvolvimento (com hot reload)
npm run start:dev

# Produção
npm start
```

### 3. Frontend (Next.js)

#### Instalação
```bash
cd frontend
npm install
```

#### Execução do Frontend
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### 4. Acesso à Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### 5. Scripts Úteis

```bash
# No diretório backend/
npm run db:reset          # Resetar banco de dados
npm run lint              # Verificar código
npm run format            # Formatar código
npm test                  # Executar testes

# Scripts de desenvolvimento
node scripts/setup-database.js                    # Configurar BD
node scripts/coordinates/verify-map-coordinates.js # Verificar coordenadas
node scripts/frontend/test-map-integration.js     # Testar integração
```

## 📁 Estrutura do Projeto

```
joao-monlevade-water-monitoring/
├── backend/                    # API Express.js
│   ├── src/
│   │   ├── auth/              # Módulo de autenticação
│   │   ├── users/             # Módulo de usuários
│   │   ├── status/            # Módulo de status dos bairros
│   │   ├── controllers/       # Controladores da API
│   │   ├── models/            # Modelos do Sequelize
│   │   ├── middleware/        # Middlewares customizados
│   │   ├── database/          # Configuração do banco
│   │   └── main.js           # Arquivo principal
│   ├── database/
│   │   ├── migrations/        # Migrações do banco
│   │   ├── init.sql          # Script inicial
│   │   └── create_database.sql # Criação do banco
│   ├── scripts/               # Scripts de desenvolvimento e testes
│   │   ├── backend/
│   │   │   ├── tests/        # Scripts de teste (50+ arquivos)
│   │   │   └── config/       # Scripts de configuração
│   │   ├── frontend/         # Testes de integração frontend
│   │   └── coordinates/      # Scripts de coordenadas geográficas
│   └── package.json
├── frontend/                   # Interface Next.js
│   ├── components/
│   │   ├── Map.js            # Componente principal do mapa
│   │   └── MapPicker.js      # Seletor de coordenadas
│   ├── pages/
│   │   ├── dashboard.js      # Dashboard principal
│   │   ├── login.js          # Página de login
│   │   ├── index.js          # Página inicial
│   │   └── _app.js           # Configuração global
│   ├── styles/
│   │   └── globals.css       # Estilos globais
│   ├── public/
│   │   └── leaflet/          # Assets do Leaflet
│   └── package.json
├── .gitignore                  # Arquivos ignorados pelo Git
├── package.json               # Dependências do projeto
└── README.md                  # Documentação
```

## 🗺️ Mapa e Coordenadas

### Bairros Monitorados (65 total)
Todos os 65 bairros oficiais de João Monlevade possuem:
- Coordenadas geográficas aproximadas
- Status de abastecimento em tempo real
- Marcadores visuais no mapa
- Popups informativos

### Sistema de Cores
- 🔵 **Azul**: Abastecimento normal
- 🟡 **Amarelo**: Abastecimento intermitente
- 🔴 **Vermelho**: Sem abastecimento
- ⚪ **Cinza**: Status desconhecido

## 🧪 Testes e Scripts

### Scripts de Desenvolvimento
Todos os scripts de teste e desenvolvimento estão organizados na pasta `backend/scripts/`:

#### Testes de Backend (`backend/scripts/backend/tests/`)
- Scripts de teste de analytics e ranking
- Verificação de disponibilidade e status
- Debug e análise de dados
- Testes de integração

#### Configuração (`backend/scripts/backend/config/`)
- Scripts de setup e configuração
- Criação e atualização de dados
- Configuração de ambiente

#### Testes de Frontend (`backend/scripts/frontend/`)
- Testes de integração frontend-backend
- Verificação de componentes do mapa

#### Coordenadas (`backend/scripts/coordinates/`)
- Geração e verificação de coordenadas
- Validação de dados geográficos

### Comandos Principais
```bash
# Configurar banco de dados
npm run db:setup

# Executar testes
npm test

# Verificar coordenadas
node backend/scripts/coordinates/verify-map-coordinates.js

# Teste de integração do mapa
node backend/scripts/frontend/test-map-integration.js
```

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/login` - Autenticação de usuários
- `POST /api/auth/logout` - Logout de usuários
- `GET /api/auth/profile` - Perfil do usuário autenticado

### Status dos Bairros
- `GET /api/status` - Lista todos os bairros e seus status atuais
- `GET /api/status/:id` - Status específico de um bairro
- `PUT /api/status/:id` - Atualizar status de um bairro (requer autenticação)
- `GET /api/status/history/:id` - Histórico de status de um bairro

### Usuários (Admin)
- `GET /api/users` - Listar usuários (requer autenticação admin)
- `POST /api/users` - Criar novo usuário (requer autenticação admin)
- `PUT /api/users/:id` - Atualizar usuário (requer autenticação admin)
- `DELETE /api/users/:id` - Remover usuário (requer autenticação admin)

### Sistema
- `GET /api/health` - Verificação de saúde da API
- `GET /api/neighborhoods` - Lista todos os bairros com coordenadas
- `GET /api/analytics` - Estatísticas do sistema (requer autenticação)

## 🔄 Próximas Versões

### v1.1 (Atual)
- ✅ Sistema de monitoramento em tempo real
- ✅ Mapa interativo com 65 bairros
- ✅ Sistema de autenticação JWT
- ✅ API REST completa
- ✅ Dashboard responsivo
- ✅ Scripts de teste e desenvolvimento organizados

### v1.2 (Planejada)
- 📍 Coordenadas GPS precisas dos bairros
- 📊 Histórico detalhado de status por bairro
- 🔔 Notificações push em tempo real
- 📈 Relatórios e analytics avançados
- 🎨 Interface aprimorada

### v1.3 (Planejada)
- 📱 Aplicativo mobile (React Native)
- 🏛️ Integração com sistemas municipais
- 🔧 Previsão de manutenções
- 👨‍💼 Dashboard administrativo avançado
- 🌐 API pública para desenvolvedores

## 🤝 Contribuição

Este projeto faz parte do TCC (Trabalho de Conclusão de Curso) da UFOP e está aberto para contribuições da comunidade.

### Como Contribuir
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Desenvolvedor Principal
- **Rafael Suzuki** - Desenvolvimento Full Stack
- 📧 Email: [seu-email@exemplo.com]
- 💼 LinkedIn: [seu-linkedin]

### Orientação Acadêmica
- **UFOP** - Universidade Federal de Ouro Preto
- **Curso**: Engenharia de Computação
- **Período**: 2024

## 📊 Status do Projeto

- ✅ **Backend API**: Funcional e estável
- ✅ **Frontend Web**: Interface responsiva completa
- ✅ **Banco de Dados**: PostgreSQL configurado
- ✅ **Autenticação**: Sistema JWT implementado
- ✅ **Mapas**: Integração Leaflet funcionando
- 🔄 **Testes**: Em desenvolvimento
- 📱 **Mobile**: Planejado para v1.3

## 📞 Suporte

Para dúvidas, sugestões ou reportar problemas:

- 🐛 **Issues**: [GitHub Issues](link-para-issues)
- 📧 **Email**: [seu-email@exemplo.com]
- 📚 **Documentação**: Consulte este README

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

**Desenvolvido para fins acadêmicos como parte do TCC da UFOP.**

---

<div align="center">

**🚰 João Monlevade Water Monitoring System v1.1**  
*Monitoramento inteligente para uma cidade conectada* 🏙️💧

**Feito com ❤️ por [Rafael Suzuki](link-para-perfil)**

</div>