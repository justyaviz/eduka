-- Eduka 21.7.0 cashdesk scaffold
CREATE TABLE IF NOT EXISTS cashdesk_sessions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  opened_by INTEGER,
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  status VARCHAR(40) DEFAULT 'open'
);
