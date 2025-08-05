# Sistema de Monitoramento de Abastecimento de Água - João Monlevade

## Versão Teste 1.1

Sistema completo para monitoramento do status de abastecimento de água nos 65 bairros oficiais de João Monlevade, MG.

## 🚀 Funcionalidades

### ✅ Implementadas na v1.1
- **Mapa Interativo Completo**: Visualização de todos os 65 bairros oficiais
- **Status em Tempo Real**: Monitoramento do abastecimento (Normal, Intermitente, Sem água)
- **Marcadores Coloridos**: Sistema visual intuitivo por cores
- **Coordenadas Precisas**: Localização geográfica aproximada de cada bairro
- **API RESTful**: Backend robusto com NestJS e PostgreSQL
- **Dashboard Responsivo**: Interface moderna e responsiva

## 🛠️ Tecnologias

### Backend
- **Node.js** com **NestJS**
- **PostgreSQL** para persistência de dados
- **API RESTful** com endpoints documentados

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

### Frontend
```bash
cd frontend
npm install
npm run dev
```

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