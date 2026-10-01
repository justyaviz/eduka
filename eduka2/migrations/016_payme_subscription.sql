CREATE TABLE IF NOT EXISTS eduka_subscription_orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 request_id UUID NOT NULL,
 tariff TEXT NOT NULL,
 amount BIGINT NOT NULL CHECK(amount>0),
 days INTEGER NOT NULL DEFAULT 30 CHECK(days=30),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW()+INTERVAL '24 hours',
 previous_subscription JSONB,
 applied_until TIMESTAMPTZ,
 platform_payment_id UUID REFERENCES platform_payments(id) ON DELETE SET NULL,
 UNIQUE(center_id,mode,request_id)
);
CREATE INDEX IF NOT EXISTS eduka_subscription_orders_center ON eduka_subscription_orders(center_id,created_at DESC);
CREATE TABLE IF NOT EXISTS eduka_payme_transactions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 payme_id TEXT NOT NULL,
 order_id UUID NOT NULL REFERENCES eduka_subscription_orders(id) ON DELETE RESTRICT,
 payme_time BIGINT NOT NULL,
 create_time BIGINT NOT NULL,
 perform_time BIGINT NOT NULL DEFAULT 0,
 cancel_time BIGINT NOT NULL DEFAULT 0,
 state INTEGER NOT NULL DEFAULT 1 CHECK(state IN (1,2,-1,-2)),
 reason INTEGER,
 fiscal_perform JSONB,
 fiscal_cancel JSONB,
 UNIQUE(mode,payme_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS eduka_payme_active_order ON eduka_payme_transactions(order_id) WHERE state IN (1,2);
CREATE INDEX IF NOT EXISTS eduka_payme_statement ON eduka_payme_transactions(mode,payme_time);
