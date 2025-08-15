-- Migração para adicionar coordenadas geográficas à tabela neighborhood_status
-- Data: 2025-08-11
-- Descrição: Adiciona colunas latitude e longitude para localização dos bairros

ALTER TABLE neighborhood_status
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

-- Índice para otimizar consultas por coordenadas
CREATE INDEX IF NOT EXISTS idx_neighborhood_status_lat_lng ON neighborhood_status(latitude, longitude);

-- Comentários nas colunas
COMMENT ON COLUMN neighborhood_status.latitude IS 'Latitude do bairro (formato decimal, -90 a 90)';
COMMENT ON COLUMN neighborhood_status.longitude IS 'Longitude do bairro (formato decimal, -180 a 180)';