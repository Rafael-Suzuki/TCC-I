-- Migration: Add status_history table for analytics
-- Created: 2025-01-08
-- Purpose: Track status changes over time for analytics and reporting

CREATE TABLE IF NOT EXISTS status_history (
  id SERIAL PRIMARY KEY,
  neighborhood_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,          -- normal | intermitente | falta | sem_informacao
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by INTEGER,
  source VARCHAR(20) DEFAULT 'manual',
  notes TEXT
);

-- Index for efficient queries by neighborhood and time
CREATE INDEX IF NOT EXISTS idx_sh_nei_time ON status_history (neighborhood_id, changed_at);

-- Index for efficient queries by status and time (for analytics)
CREATE INDEX IF NOT EXISTS idx_sh_status_time ON status_history (status, changed_at);

-- Add foreign key constraint to ensure data integrity
ALTER TABLE status_history 
ADD CONSTRAINT fk_status_history_neighborhood 
FOREIGN KEY (neighborhood_id) REFERENCES neighborhood_status(id) ON DELETE CASCADE;

COMMENT ON TABLE status_history IS 'Historical record of neighborhood status changes for analytics';
COMMENT ON COLUMN status_history.status IS 'Status values: normal, intermitente, falta, sem_informacao';
COMMENT ON COLUMN status_history.source IS 'Source of the change: manual, automatic, import, etc.';