-- Eduka 21.7.0 permission matrix seed scaffold
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  role_name VARCHAR(80) NOT NULL,
  permission_key VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, role_name, permission_key)
);
