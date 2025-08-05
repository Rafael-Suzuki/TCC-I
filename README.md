# Sistema de Monitoramento de Fornecimento de Água - João Monlevade

## Versão 1.2

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
│   ├── scripts/
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
├── scripts/
│   ├── test-map-integration.js
│   ├── verify-map-coordinates.js
│   ├── generate-coordinates.js
│   ├── check-map-coordinates.js
│   ├── analyze-neighborhoods.js
│   ├── check-duplicates.js
│   ├── fix-neighborhoods.js
│   ├── clean-duplicates.js
│   └── check-count.js
├── neighborhood-coordinates.js
├── .gitignore
└── README.md
```

## 🚀 Como executar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PostgreSQL
- npm ou yarn

### Frontend
- **Next.js** com **React**
- **Leaflet** para mapas interativos
- **Tailwind CSS** para estilização
- **Componentes dinâmicos** para otimização

## 📦 Instalação

### Pré-requisitos
- Node.js (v16+)
- PostgreSQL (v12+)
- npm ou yarn

### Backend
```bash
cd backend
npm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações
npm run migration:run

# Iniciar servidor
npm run start:dev
```

<<<<<<< HEAD
## 🛠️ Scripts de Manutenção

A pasta `scripts/` contém utilitários para análise e manutenção do sistema:

### Scripts de Análise de Dados
- **`analyze-neighborhoods.js`** - Analisa diferenças entre bairros no banco e listas de referência
- **`check-duplicates.js`** - Verifica duplicatas no banco de dados
- **`check-count.js`** - Conta registros no banco
- **`clean-duplicates.js`** - Remove duplicatas do banco
- **`fix-neighborhoods.js`** - Corrige dados de bairros no banco

### Scripts de Coordenadas e Mapas
- **`generate-coordinates.js`** - Gera coordenadas para os 65 bairros de João Monlevade
- **`check-map-coordinates.js`** - Verifica coordenadas dos bairros no mapa
- **`verify-map-coordinates.js`** - Valida coordenadas dos bairros

### Scripts de Teste
- **`test-map-integration.js`** - Testa a integração do mapa com a API

**Uso dos scripts:**
```bash
# Executar da raiz do projeto
node scripts/nome-do-script.js
```

## Contribuição
=======
### Frontend
```bash
cd frontend
npm install
npm run dev
```
>>>>>>> 822bdbb33944834b39048d0e3551f09a0542f87a

## 🗂️ Estrutura do Projeto

```
TCC-I/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── status/         # Módulo de status dos bairros
│   │   ├── auth/           # Autenticação
│   │   └── users/          # Gerenciamento de usuários
│   └── database/           # Scripts SQL
├── frontend/               # Interface Next.js
│   ├── components/
│   │   └── Map.js         # Componente do mapa
│   └── pages/
│       ├── dashboard.js   # Dashboard principal
│       └── login.js       # Página de login
├── neighborhood-coordinates.js  # Coordenadas dos 65 bairros
└── test-map-integration.js     # Testes de integração
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

## 🧪 Testes

### Verificação de Coordenadas
```bash
node verify-map-coordinates.js
```

### Teste de Integração API-Mapa
```bash
node test-map-integration.js
```

## 📊 API Endpoints

- `GET /api/status` - Lista todos os bairros e seus status
- `GET /api/health` - Verificação de saúde da API
- `POST /api/auth/login` - Autenticação de usuários
- `GET /api/users` - Gerenciamento de usuários

## 🔄 Próximas Versões

### v1.2 (Planejada)
- Coordenadas GPS reais dos bairros
- Histórico de status por bairro
- Notificações em tempo real
- Relatórios de interrupções

### v1.3 (Planejada)
- App mobile
- Integração com sistemas municipais
- Previsão de manutenções
- Dashboard administrativo avançado

## 🤝 Contribuição

Este projeto faz parte do TCC (Trabalho de Conclusão de Curso) da UFOP.

### Desenvolvedor
- **Rafael Suzuki** - Desenvolvimento Full Stack

### Orientação
- **UFOP** - Universidade Federal de Ouro Preto

## 📄 Licença

Este projeto é desenvolvido para fins acadêmicos como parte do TCC da UFOP.

---

**João Monlevade Water Monitoring System v1.1**  
*Monitoramento inteligente para uma cidade conectada* 🏙️💧