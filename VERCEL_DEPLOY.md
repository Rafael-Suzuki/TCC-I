# Deploy no Vercel - Sistema de Monitoramento de Água

## 📋 Pré-requisitos

1. **Conta no Vercel**: Crie uma conta em [vercel.com](https://vercel.com)
2. **Banco de dados PostgreSQL**: Configure um banco PostgreSQL (recomendado: Neon, Supabase ou Railway)
3. **Domínio SIMAPI.ONG.BR**: Acesso ao painel de DNS do domínio

## 🚀 Passos para Deploy

### 1. Preparar o Banco de Dados

1. Crie um banco PostgreSQL em um provedor cloud:
   - **Neon** (recomendado): https://neon.tech
   - **Supabase**: https://supabase.com
   - **Railway**: https://railway.app

2. Execute os scripts SQL do diretório `backend/database/`:
   ```sql
   -- Execute create_database.sql
   -- Execute init.sql
   ```

3. Anote a string de conexão (DATABASE_URL)

### 2. Deploy no Vercel

1. **Conectar repositório**:
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Conecte seu repositório GitHub
   - Selecione o repositório `TCC-I`

2. **Configurar variáveis de ambiente**:
   ```
   NEXT_PUBLIC_API_URL=https://simapi.ong.br/api
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=seu-jwt-secret-super-seguro
   NODE_ENV=production
   DB_HOST=seu-host-postgres
   DB_PORT=5432
   DB_USERNAME=seu-usuario
   DB_PASSWORD=sua-senha
   DB_DATABASE=monitor_agua
   CORS_ORIGIN=https://simapi.ong.br
   ```

3. **Configurações de build**:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `npm run vercel-build`
   - Output Directory: `frontend/.next`

### 3. Configurar Domínio Personalizado

1. **No painel do Vercel**:
   - Vá para o projeto deployado
   - Clique em "Settings" > "Domains"
   - Adicione `simapi.ong.br`

2. **Configurar DNS**:
   - Acesse o painel de DNS do seu domínio
   - Adicione os registros fornecidos pelo Vercel:
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     ```
   - Ou configure os registros A:
     ```
     Type: A
     Name: @
     Value: 76.76.19.61
     
     Type: A
     Name: @
     Value: 76.223.126.88
     ```

### 4. Verificar Deploy

1. **Aguarde a propagação DNS** (pode levar até 48h)
2. **Teste as URLs**:
   - Frontend: https://simapi.ong.br
   - API: https://simapi.ong.br/api/health
   - Status: https://simapi.ong.br/api/status

## 🔧 Configurações Importantes

### Arquivos de Configuração Criados:

- `vercel.json`: Configuração de build e rotas
- `api/index.js`: Ponto de entrada para funções serverless
- `.env.example`: Exemplo de variáveis de ambiente
- `package.json`: Scripts de build para Vercel

### Estrutura de Rotas:

- `/` → Frontend (Next.js)
- `/api/*` → Backend (Node.js serverless)

## 🛠️ Troubleshooting

### Problemas Comuns:

1. **Erro de CORS**:
   - Verifique se `CORS_ORIGIN` está configurado corretamente
   - Confirme se o domínio está apontando para o Vercel

2. **Erro de Banco de Dados**:
   - Verifique a `DATABASE_URL`
   - Confirme se o banco está acessível externamente
   - Execute os scripts SQL de inicialização

3. **Build Failure**:
   - Verifique se todas as dependências estão no `package.json`
   - Confirme se o comando de build está correto

### Logs e Monitoramento:

- **Vercel Functions**: Acesse os logs em "Functions" no dashboard
- **Build Logs**: Verifique os logs de build em "Deployments"
- **Runtime Logs**: Monitore erros em tempo real

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no dashboard do Vercel
2. Confirme as configurações de DNS
3. Teste a conectividade com o banco de dados
4. Verifique se todas as variáveis de ambiente estão configuradas

---

**Importante**: Mantenha suas credenciais de banco de dados seguras e nunca as commite no repositório!