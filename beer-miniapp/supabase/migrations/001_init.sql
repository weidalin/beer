-- =============================================
-- 广东精酿啤酒一站式供应链 — 数据库初始化
-- 执行环境：Supabase SQL Editor
-- =============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 用户表
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid     TEXT UNIQUE NOT NULL,
  nickname   TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 产品分类表
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL CHECK (slug IN ('beer', 'beer_machine', 'beer_car')),
  sort_order INT DEFAULT 0
);

-- 插入初始分类数据
INSERT INTO categories (name, slug, sort_order) VALUES
  ('桶装鲜啤', 'beer', 10),
  ('打酒机', 'beer_machine', 20),
  ('啤酒车', 'beer_car', 30)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 产品表
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL REFERENCES categories(slug),
  description TEXT,
  spec        TEXT,
  price_range TEXT DEFAULT '面议',
  supply_type TEXT DEFAULT 'both' CHECK (supply_type IN ('sell', 'rent', 'both')),
  cover_image TEXT,
  images      JSONB DEFAULT '[]'::jsonb,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0,
  tags        JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 客户意向表
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT,
  location        JSONB,
  biz_type        TEXT CHECK (biz_type IN ('night_stall', 'open_restaurant', 'market', 'other')),
  daily_volume    TEXT CHECK (daily_volume IN ('<50', '50-100', '>100')),
  interested_plan TEXT CHECK (interested_plan IN ('basic', 'standard', 'premium', 'undecided')),
  need_beer_car   BOOLEAN DEFAULT false,
  beer_car_type   TEXT CHECK (beer_car_type IN ('buy', 'rent')),
  delivery_area   TEXT CHECK (delivery_area IN ('prd', 'other')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'signed', 'lost')),
  source          TEXT,
  notes           TEXT,
  follow_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 报修工单表
-- =============================================
CREATE TABLE IF NOT EXISTS repair_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id),
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  device_type    TEXT NOT NULL CHECK (device_type IN ('beer_machine', 'beer_car', 'other')),
  issue_desc     TEXT NOT NULL,
  issue_images   JSONB DEFAULT '[]'::jsonb,
  preferred_time TIMESTAMPTZ,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'processing', 'done')),
  assignee       TEXT,
  handler_notes  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 合作方案表
-- =============================================
CREATE TABLE IF NOT EXISTS plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('basic', 'standard', 'premium')),
  description TEXT,
  features    JSONB DEFAULT '[]'::jsonb,
  excluded    JSONB DEFAULT '[]'::jsonb,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0
);

-- 插入初始方案数据
INSERT INTO plans (name, level, description, features, excluded, sort_order) VALUES
(
  '基础版',
  'basic',
  '轻松起步，零门槛合作',
  '["免押金起步", "每周1次配送", "桶装鲜啤直供", "72小时维修响应", "专属业务对接"]'::jsonb,
  '["不含打酒机", "不含啤酒车（可单独选配）"]'::jsonb,
  10
),
(
  '标准版',
  'standard',
  '最受欢迎，性价比之选',
  '["免押金起步", "每周2次配送", "桶装鲜啤直供", "提供打酒机1台", "48小时维修响应", "专属业务对接", "优先发货保障"]'::jsonb,
  '["不含啤酒车（可单独选配）"]'::jsonb,
  20
),
(
  '旗舰版',
  'premium',
  '全方位支持，高销量档口首选',
  '["免押金起步", "每日配送", "桶装鲜啤直供", "提供打酒机1台", "4小时紧急维修响应", "专属客户经理", "优先发货保障", "定期设备保养"]'::jsonb,
  '["不含啤酒车（可单独选配）"]'::jsonb,
  30
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 自动更新 updated_at 触发器
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER repair_orders_updated_at
  BEFORE UPDATE ON repair_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS 行级权限策略
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 产品表：所有人可读上架产品；admin 可读写全部
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.openid = auth.jwt() ->> 'sub'
        AND users.role = 'admin'
    )
  );

-- 合作方案：所有人可读
CREATE POLICY "plans_public_read" ON plans
  FOR SELECT USING (is_active = true);

-- 客户表：用户只能操作自己的记录；admin 可操作全部
CREATE POLICY "customers_own_select" ON customers
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.openid = auth.jwt() ->> 'sub'
        AND users.role = 'admin'
    )
  );

CREATE POLICY "customers_own_insert" ON customers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_admin_update" ON customers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.openid = auth.jwt() ->> 'sub'
        AND users.role = 'admin'
    )
  );

-- 工单表：用户只能操作自己的记录；admin 可操作全部
CREATE POLICY "repair_own_select" ON repair_orders
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.openid = auth.jwt() ->> 'sub'
        AND users.role = 'admin'
    )
  );

CREATE POLICY "repair_own_insert" ON repair_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "repair_admin_update" ON repair_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.openid = auth.jwt() ->> 'sub'
        AND users.role = 'admin'
    )
  );
