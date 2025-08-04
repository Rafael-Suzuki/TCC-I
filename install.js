#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Instalando dependências do Sistema de Monitoramento de Água...');

// Função para executar comandos
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📦 Executando: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Verificar se estamos no diretório correto
if (!fs.existsSync('frontend') || !fs.existsSync('backend')) {
  console.error('❌ Execute este script na raiz do projeto (onde estão as pastas frontend e backend)');
  process.exit(1);
}

console.log('\n📁 Instalando dependências do backend...');
if (!runCommand('npm install', 'backend')) {
  console.error('❌ Falha ao instalar dependências do backend');
  process.exit(1);
}

console.log('\n📁 Instalando dependências do frontend...');
if (!runCommand('npm install', 'frontend')) {
  console.error('❌ Falha ao instalar dependências do frontend');
  process.exit(1);
}

console.log('\n📁 Instalando dependências da raiz...');
if (!runCommand('npm install')) {
  console.error('❌ Falha ao instalar dependências da raiz');
  process.exit(1);
}

// Verificar se existe arquivo .env no backend
const backendEnvPath = path.join('backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  console.log('\n⚠️  Arquivo .env não encontrado no backend.');
  console.log('📋 Copie o arquivo .env.example e configure suas variáveis:');
  console.log('   cd backend && cp .env.example .env');
}

// Verificar se existe arquivo .env na raiz
const rootEnvPath = '.env';
if (!fs.existsSync(rootEnvPath)) {
  console.log('\n⚠️  Arquivo .env não encontrado na raiz.');
  console.log('📋 Copie o arquivo .env.example e configure suas variáveis:');
  console.log('   cp .env.example .env');
}

console.log('\n✅ Instalação concluída com sucesso!');
console.log('\n📖 Próximos passos:');
console.log('1. Configure o banco de dados PostgreSQL');
console.log('2. Configure as variáveis de ambiente (.env)');
console.log('3. Execute: npm run dev (desenvolvimento)');
console.log('4. Para deploy no Vercel, consulte VERCEL_DEPLOY.md');
console.log('\n🌐 URLs de desenvolvimento:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend:  http://localhost:3001');
console.log('   API:      http://localhost:3001/api');