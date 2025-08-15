#!/bin/bash

# Script de teste para integração do mapa com coordenadas
# Testa a funcionalidade de atualização de coordenadas de bairros

echo "=== Teste de Integração do Mapa ==="
echo "Testando funcionalidade de coordenadas de bairros"
echo ""

# Configurações
BASE_URL="http://localhost:3001/api"
TEST_EMAIL="admin@example.com"
TEST_PASSWORD="admin123"
TEST_NEIGHBORHOOD_ID=1
TEST_LATITUDE=-19.816562
TEST_LONGITUDE=-43.168972

echo "1. Fazendo login para obter token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Resposta do login: $LOGIN_RESPONSE"

# Extrair token (assumindo que a resposta é JSON com campo 'token')
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro: Não foi possível obter o token de autenticação"
  echo "Verifique se o backend está rodando e as credenciais estão corretas"
  exit 1
fi

echo "✅ Token obtido com sucesso"
echo ""

echo "2. Listando bairros para verificar estrutura..."
NEIGHBORHOODS_RESPONSE=$(curl -s -X GET "$BASE_URL/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Primeiros bairros encontrados:"
echo $NEIGHBORHOODS_RESPONSE | head -c 500
echo "..."
echo ""

echo "3. Testando atualização de coordenadas..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/status/$TEST_NEIGHBORHOOD_ID/coords" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"latitude\": $TEST_LATITUDE,
    \"longitude\": $TEST_LONGITUDE
  }")

echo "Resposta da atualização: $UPDATE_RESPONSE"
echo ""

echo "4. Verificando se as coordenadas foram atualizadas..."
VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/status/$TEST_NEIGHBORHOOD_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Dados do bairro após atualização: $VERIFY_RESPONSE"
echo ""

echo "5. Testando coordenadas inválidas..."
INVALID_RESPONSE=$(curl -s -X PUT "$BASE_URL/status/$TEST_NEIGHBORHOOD_ID/coords" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"latitude\": 999,
    \"longitude\": 999
  }")

echo "Resposta para coordenadas inválidas: $INVALID_RESPONSE"
echo ""

echo "6. Testando sem autenticação..."
NO_AUTH_RESPONSE=$(curl -s -X PUT "$BASE_URL/status/$TEST_NEIGHBORHOOD_ID/coords" \
  -H "Content-Type: application/json" \
  -d "{
    \"latitude\": $TEST_LATITUDE,
    \"longitude\": $TEST_LONGITUDE
  }")

echo "Resposta sem autenticação: $NO_AUTH_RESPONSE"
echo ""

echo "=== Resumo dos Testes ==="
echo "✅ Login e obtenção de token"
echo "✅ Listagem de bairros"
echo "✅ Atualização de coordenadas válidas"
echo "✅ Verificação de dados atualizados"
echo "✅ Teste de validação (coordenadas inválidas)"
echo "✅ Teste de segurança (sem autenticação)"
echo ""
echo "🎉 Todos os testes foram executados!"
echo "Verifique as respostas acima para confirmar se tudo está funcionando corretamente."
echo ""
echo "Para testar o frontend:"
echo "1. Acesse http://localhost:3000"
echo "2. Faça login com admin@example.com / admin123"
echo "3. Vá para o Dashboard"
echo "4. Clique no ícone de mapa (📍) ao lado de um bairro"
echo "5. Use o MapPicker para definir coordenadas"
echo "6. Verifique se o marcador aparece no mapa principal"