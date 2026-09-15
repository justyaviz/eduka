-- EDUKA Clone v2.2 — Rooms & Equipment. Additive/idempotent only.

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS responsible_user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='rooms_responsible_user_fk'
  ) THEN
    ALTER TABLE rooms
      ADD CONSTRAINT rooms_responsible_user_fk
      FOREIGN KEY (responsible_user_id) REFERENCES center_users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS room_equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  name VARCHAR(180) NOT NULL,
  inventory_code VARCHAR(120),
  price NUMERIC(14,2) DEFAULT 0,
  purchased_at DATE,
  note TEXT,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_equipments_center ON room_equipments(center_id);
CREATE INDEX IF NOT EXISTS idx_room_equipments_center_room ON room_equipments(center_id,room_id);
CREATE INDEX IF NOT EXISTS idx_room_equipments_center_date ON room_equipments(center_id,purchased_at);
