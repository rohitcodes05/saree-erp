-- ============================================================
-- SAREE ERP – INITIAL SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: All tables, indexes, and constraints
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'shop_manager',
  'cashier',
  'staff'
);

CREATE TYPE inventory_transaction_type AS ENUM (
  'stock_in',
  'stock_out',
  'transfer_in',
  'transfer_out',
  'damage',
  'lost',
  'adjustment',
  'return'
);

CREATE TYPE sale_status AS ENUM (
  'draft',
  'completed',
  'cancelled',
  'returned',
  'partially_returned'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'upi',
  'card',
  'wallet',
  'exchange',
  'mixed'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE purchase_order_status AS ENUM (
  'draft',
  'sent',
  'received',
  'partially_received',
  'cancelled'
);

CREATE TYPE notification_type AS ENUM (
  'low_stock',
  'pending_payment',
  'new_order',
  'inventory_alert',
  'staff_alert',
  'system'
);

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'half_day',
  'leave',
  'holiday'
);

CREATE TYPE gst_rate AS ENUM ('0', '5', '12', '18', '28');

CREATE TYPE return_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'completed'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: companies
-- Top-level tenant. One company = one business owner with multiple shops.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(255)  NOT NULL,
  logo_url            TEXT,
  address             TEXT,
  phone               VARCHAR(20),
  email               VARCHAR(255),
  gst_number          VARCHAR(20),
  pan_number          VARCHAR(20),
  website             VARCHAR(255),
  currency            VARCHAR(10)   NOT NULL DEFAULT 'INR',
  currency_symbol     VARCHAR(5)    NOT NULL DEFAULT '₹',
  fiscal_year_start   SMALLINT      NOT NULL DEFAULT 4,   -- 4 = April (India)
  timezone            VARCHAR(100)  NOT NULL DEFAULT 'Asia/Kolkata',
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  settings            JSONB         NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Top-level multi-tenant entity. All data is scoped to a company.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Extends auth.users with role, company assignment, and preferences.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   UUID        REFERENCES companies(id) ON DELETE SET NULL,
  first_name   VARCHAR(100) NOT NULL DEFAULT '',
  last_name    VARCHAR(100),
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(20),
  avatar_url   TEXT,
  role         user_role   NOT NULL DEFAULT 'staff',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  last_login   TIMESTAMPTZ,
  preferences  JSONB       NOT NULL DEFAULT '{"theme":"dark","language":"en","notifications":true,"sidebar_collapsed":false}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Extended user profiles linked 1:1 to auth.users.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: shops
-- Individual retail locations owned by a company.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE shops (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  code           VARCHAR(20)  NOT NULL,
  logo_url       TEXT,
  address        TEXT        NOT NULL,
  city           VARCHAR(100),
  state          VARCHAR(100),
  pincode        VARCHAR(10),
  phone          VARCHAR(20),
  email          VARCHAR(255),
  gst_number     VARCHAR(20),
  opening_time   TIME        NOT NULL DEFAULT '09:00',
  closing_time   TIME        NOT NULL DEFAULT '21:00',
  manager_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  settings       JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT shops_code_company_unique UNIQUE (company_id, code)
);

COMMENT ON TABLE shops IS 'Physical retail store locations. Each shop has a unique code within a company.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: shop_staff
-- Maps profiles to shops with a specific role.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE shop_staff (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  profile_id  UUID      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  is_active   BOOLEAN   NOT NULL DEFAULT true,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT shop_staff_unique UNIQUE (shop_id, profile_id)
);

COMMENT ON TABLE shop_staff IS 'Staff assignments: which profile works at which shop with which role.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: shop_settings
-- Per-shop configuration: invoicing, loyalty, integrations.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE shop_settings (
  id                         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id                    UUID    NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
  invoice_prefix             VARCHAR(20) NOT NULL DEFAULT 'INV',
  invoice_number_start       INTEGER NOT NULL DEFAULT 1,
  invoice_current_number     INTEGER NOT NULL DEFAULT 1,
  loyalty_points_per_rupee   DECIMAL(10,4) NOT NULL DEFAULT 1.0,
  loyalty_redemption_rate    DECIMAL(10,4) NOT NULL DEFAULT 1.0,
  min_redemption_points      INTEGER NOT NULL DEFAULT 100,
  tax_inclusive              BOOLEAN NOT NULL DEFAULT false,
  enable_loyalty             BOOLEAN NOT NULL DEFAULT true,
  enable_exchange            BOOLEAN NOT NULL DEFAULT true,
  allow_negative_stock       BOOLEAN NOT NULL DEFAULT false,
  auto_print_receipt         BOOLEAN NOT NULL DEFAULT true,
  receipt_header             TEXT,
  receipt_footer             TEXT,
  whatsapp_enabled           BOOLEAN NOT NULL DEFAULT false,
  whatsapp_phone             VARCHAR(20),
  -- Extensible: future WhatsApp Business API credentials stored here
  whatsapp_config            JSONB   NOT NULL DEFAULT '{}',
  email_enabled              BOOLEAN NOT NULL DEFAULT false,
  smtp_settings              JSONB   NOT NULL DEFAULT '{}',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE shop_settings IS 'Per-shop operational settings including invoice numbering, loyalty, and integrations.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: categories
-- Hierarchical product categories (supports parent-child nesting).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_slug_company_unique UNIQUE (company_id, slug)
);

COMMENT ON TABLE categories IS 'Hierarchical product categories. Supports Silk > Kanjivaram type nesting.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: brands
-- Saree brand master.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE brands (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url    TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT brands_name_company_unique UNIQUE (company_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: suppliers
-- Supplier/vendor master with payment terms and banking details.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  contact_person      VARCHAR(255),
  phone               VARCHAR(20),
  alternate_phone     VARCHAR(20),
  email               VARCHAR(255),
  address             TEXT,
  city                VARCHAR(100),
  state               VARCHAR(100),
  pincode             VARCHAR(10),
  gst_number          VARCHAR(20),
  pan_number          VARCHAR(20),
  bank_name           VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_ifsc           VARCHAR(20),
  opening_balance     DECIMAL(15,2) NOT NULL DEFAULT 0,
  credit_limit        DECIMAL(15,2) NOT NULL DEFAULT 0,
  credit_days         INTEGER       NOT NULL DEFAULT 30,
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: products
-- Saree product catalog with all domain-specific attributes.
-- Includes a generated GIN full-text search column.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id      UUID         REFERENCES categories(id) ON DELETE SET NULL,
  brand_id         UUID         REFERENCES brands(id) ON DELETE SET NULL,
  supplier_id      UUID         REFERENCES suppliers(id) ON DELETE SET NULL,

  -- ── Identification ──────────────────────────────────────────────────────
  sku              VARCHAR(100) NOT NULL,
  barcode          VARCHAR(100),
  qr_code          TEXT,

  -- ── Basic Info ──────────────────────────────────────────────────────────
  name             VARCHAR(500) NOT NULL,
  description      TEXT,

  -- ── Saree-Specific Attributes ────────────────────────────────────────────
  fabric           VARCHAR(100),
  weaving_type     VARCHAR(100),
  occasion         VARCHAR(100),
  sleeve_type      VARCHAR(100),
  border_type      VARCHAR(100),
  pattern          VARCHAR(100),
  color            VARCHAR(100),
  color_hex        VARCHAR(10),
  size             VARCHAR(50),
  weight_grams     DECIMAL(10,3),

  -- ── Pricing ─────────────────────────────────────────────────────────────
  purchase_price   DECIMAL(15,2) NOT NULL DEFAULT 0,
  selling_price    DECIMAL(15,2) NOT NULL DEFAULT 0,
  mrp              DECIMAL(15,2),
  discount_percent DECIMAL(5,2)  NOT NULL DEFAULT 0,
  gst_rate         gst_rate      NOT NULL DEFAULT '5',
  is_tax_inclusive BOOLEAN       NOT NULL DEFAULT false,

  -- ── Status / Flags ──────────────────────────────────────────────────────
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  is_featured      BOOLEAN       NOT NULL DEFAULT false,

  -- ── Metadata ────────────────────────────────────────────────────────────
  tags             TEXT[]        NOT NULL DEFAULT '{}',
  rack_number      VARCHAR(50),
  minimum_stock    INTEGER       NOT NULL DEFAULT 5,

  -- ── Full-Text Search (generated, stored) ────────────────────────────────
  search_vector    tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(sku, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(barcode, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(fabric, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(color, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'D')
  ) STORED,

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT products_sku_company_unique UNIQUE (company_id, sku)
);

COMMENT ON TABLE products IS 'Complete saree product catalog with domain-specific attributes and full-text search.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: product_images
-- Multiple images per product with ordering and primary flag.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE product_images (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  storage_path TEXT,
  is_primary  BOOLEAN     NOT NULL DEFAULT false,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: inventory
-- Current stock level per product per shop.
-- The source of truth for available quantity.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inventory (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id             UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id          UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity            INTEGER     NOT NULL DEFAULT 0,
  reserved_quantity   INTEGER     NOT NULL DEFAULT 0,
  minimum_stock       INTEGER     NOT NULL DEFAULT 5,
  rack_number         VARCHAR(50),
  last_stock_update   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT inventory_shop_product_unique UNIQUE (shop_id, product_id),
  CONSTRAINT inventory_quantity_non_negative CHECK (quantity >= 0)
);

COMMENT ON TABLE inventory IS 'Current stock levels per product per shop. Never goes negative unless allow_negative_stock is true.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: inventory_transactions
-- Immutable audit trail of every stock change.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inventory_transactions (
  id                   UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id              UUID                     NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  product_id           UUID                     NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  type                 inventory_transaction_type NOT NULL,
  quantity             INTEGER                  NOT NULL,
  quantity_before      INTEGER,
  quantity_after       INTEGER,
  reference_type       VARCHAR(50),   -- 'sale','purchase_order','transfer','manual','return'
  reference_id         UUID,
  destination_shop_id  UUID                     REFERENCES shops(id) ON DELETE SET NULL,
  unit_cost            DECIMAL(15,2),
  notes                TEXT,
  created_by           UUID                     REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_transactions IS 'Append-only ledger of all stock movements. Never updated or deleted.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: stock_alerts
-- Triggered automatically when stock drops to or below minimum_stock.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE stock_alerts (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id     UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock  INTEGER     NOT NULL,
  minimum_stock  INTEGER     NOT NULL,
  is_resolved    BOOLEAN     NOT NULL DEFAULT false,
  resolved_at    TIMESTAMPTZ,
  resolved_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: customers
-- Customer CRM with loyalty, contact, and visit tracking.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE customers (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id           UUID         REFERENCES shops(id) ON DELETE SET NULL,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100),
  phone             VARCHAR(20)  NOT NULL,
  alternate_phone   VARCHAR(20),
  email             VARCHAR(255),
  address           TEXT,
  city              VARCHAR(100),
  state             VARCHAR(100),
  pincode           VARCHAR(10),
  date_of_birth     DATE,
  anniversary_date  DATE,
  gender            VARCHAR(20),
  loyalty_points    DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_purchases   DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_visits      INTEGER       NOT NULL DEFAULT 0,
  last_visit        TIMESTAMPTZ,
  customer_group    VARCHAR(50)  NOT NULL DEFAULT 'regular',
  whatsapp_opt_in   BOOLEAN      NOT NULL DEFAULT false,
  email_opt_in      BOOLEAN      NOT NULL DEFAULT false,
  notes             TEXT,
  tags              TEXT[]        NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT customers_phone_company_unique UNIQUE (company_id, phone)
);

COMMENT ON TABLE customers IS 'Customer CRM. Phone + company_id is the unique identifier.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: loyalty_transactions
-- Loyalty point earn/redeem ledger per customer.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE loyalty_transactions (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  shop_id         UUID         NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  points          DECIMAL(15,2) NOT NULL,
  type            VARCHAR(20)  NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  reference_type  VARCHAR(50),
  reference_id    UUID,
  balance_after   DECIMAL(15,2),
  notes           TEXT,
  created_by      UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: coupons
-- Discount coupons – percentage or fixed, with usage limits and date validity.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE coupons (
  id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id             UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id                UUID         REFERENCES shops(id) ON DELETE CASCADE,
  code                   VARCHAR(50)  NOT NULL,
  description            TEXT,
  discount_type          VARCHAR(20)  NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value         DECIMAL(15,2) NOT NULL,
  minimum_purchase       DECIMAL(15,2) NOT NULL DEFAULT 0,
  maximum_discount       DECIMAL(15,2),
  usage_limit            INTEGER,
  used_count             INTEGER      NOT NULL DEFAULT 0,
  per_customer_limit     INTEGER      NOT NULL DEFAULT 1,
  valid_from             TIMESTAMPTZ,
  valid_until            TIMESTAMPTZ,
  is_active              BOOLEAN      NOT NULL DEFAULT true,
  applicable_categories  UUID[],
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT coupons_code_company_unique UNIQUE (company_id, code)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: sales
-- POS sale header. Each completed transaction.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sales (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id               UUID          NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  invoice_number        VARCHAR(50)   NOT NULL,
  customer_id           UUID          REFERENCES customers(id) ON DELETE SET NULL,
  sale_date             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Financials ────────────────────────────────────────────────────────────
  subtotal              DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount       DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_percent      DECIMAL(5,2)  NOT NULL DEFAULT 0,
  coupon_id             UUID          REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_discount       DECIMAL(15,2) NOT NULL DEFAULT 0,
  taxable_amount        DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_amount            DECIMAL(15,2) NOT NULL DEFAULT 0,
  cgst_amount           DECIMAL(15,2) NOT NULL DEFAULT 0,
  sgst_amount           DECIMAL(15,2) NOT NULL DEFAULT 0,
  igst_amount           DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- ── Loyalty ───────────────────────────────────────────────────────────────
  loyalty_points_used   DECIMAL(15,2) NOT NULL DEFAULT 0,
  loyalty_discount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  loyalty_points_earned DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- ── Totals ────────────────────────────────────────────────────────────────
  total_amount          DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid           DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_due            DECIMAL(15,2) NOT NULL DEFAULT 0,
  change_amount         DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- ── Status ────────────────────────────────────────────────────────────────
  status                sale_status   NOT NULL DEFAULT 'completed',
  payment_status        payment_status NOT NULL DEFAULT 'completed',

  -- ── Metadata ──────────────────────────────────────────────────────────────
  created_by            UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  notes                 TEXT,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT sales_invoice_number_unique UNIQUE (invoice_number)
);

COMMENT ON TABLE sales IS 'POS sale header. Invoice number is globally unique.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: sale_items
-- Line items for each sale. Prices are snapshotted at time of sale.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sale_items (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id          UUID          NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id       UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- ── Snapshot ──────────────────────────────────────────────────────────────
  product_name     VARCHAR(500)  NOT NULL,
  product_sku      VARCHAR(100),
  product_barcode  VARCHAR(100),

  -- ── Pricing ───────────────────────────────────────────────────────────────
  quantity         INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price       DECIMAL(15,2) NOT NULL,
  purchase_price   DECIMAL(15,2),
  discount_percent DECIMAL(5,2)  NOT NULL DEFAULT 0,
  discount_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_rate         gst_rate      NOT NULL DEFAULT '5',
  gst_amount       DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount     DECIMAL(15,2) NOT NULL,

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: payments
-- Multi-payment splits for a single sale (cash + UPI + card, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id           UUID          NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method            payment_method NOT NULL,
  amount            DECIMAL(15,2)  NOT NULL CHECK (amount > 0),
  reference_number  VARCHAR(100),
  status            payment_status NOT NULL DEFAULT 'completed',
  gateway_response  JSONB,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: returns
-- Return/refund header linked to original sale.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE returns (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id           UUID          NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  original_sale_id  UUID          NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  return_number     VARCHAR(50)   NOT NULL,
  customer_id       UUID          REFERENCES customers(id) ON DELETE SET NULL,
  return_date       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  reason            TEXT,
  refund_amount     DECIMAL(15,2) NOT NULL DEFAULT 0,
  refund_method     payment_method,
  restocked         BOOLEAN       NOT NULL DEFAULT true,
  status            return_status NOT NULL DEFAULT 'completed',
  processed_by      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT returns_return_number_unique UNIQUE (return_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: return_items
-- Individual items being returned.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE return_items (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id     UUID          NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id  UUID          NOT NULL REFERENCES sale_items(id) ON DELETE RESTRICT,
  product_id    UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity      INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(15,2) NOT NULL,
  refund_amount DECIMAL(15,2) NOT NULL,
  condition     VARCHAR(50)   NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'unsellable')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: purchase_orders
-- Purchase orders raised against suppliers.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE purchase_orders (
  id                     UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id                UUID                   NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  supplier_id            UUID                   NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  po_number              VARCHAR(50)            NOT NULL,
  order_date             DATE                   NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_date          DATE,

  -- ── Financials ────────────────────────────────────────────────────────────
  subtotal               DECIMAL(15,2)          NOT NULL DEFAULT 0,
  tax_amount             DECIMAL(15,2)          NOT NULL DEFAULT 0,
  shipping_amount        DECIMAL(15,2)          NOT NULL DEFAULT 0,
  discount_amount        DECIMAL(15,2)          NOT NULL DEFAULT 0,
  total_amount           DECIMAL(15,2)          NOT NULL DEFAULT 0,
  paid_amount            DECIMAL(15,2)          NOT NULL DEFAULT 0,
  outstanding_amount     DECIMAL(15,2)          NOT NULL DEFAULT 0,

  status                 purchase_order_status  NOT NULL DEFAULT 'draft',
  notes                  TEXT,
  created_by             UUID                   REFERENCES profiles(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ            NOT NULL DEFAULT NOW(),

  CONSTRAINT po_number_unique UNIQUE (po_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: purchase_order_items
-- Line items for each purchase order.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE purchase_order_items (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id   UUID          NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id          UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  ordered_quantity    INTEGER       NOT NULL CHECK (ordered_quantity > 0),
  received_quantity   INTEGER       NOT NULL DEFAULT 0,
  unit_cost           DECIMAL(15,2) NOT NULL,
  total_cost          DECIMAL(15,2) NOT NULL,
  gst_rate            gst_rate      NOT NULL DEFAULT '5',
  gst_amount          DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: supplier_payments
-- Payments made to suppliers against purchase orders.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE supplier_payments (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id         UUID          NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_order_id   UUID          REFERENCES purchase_orders(id) ON DELETE SET NULL,
  amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  payment_method      payment_method NOT NULL,
  reference_number    VARCHAR(100),
  notes               TEXT,
  created_by          UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: employees
-- Extended employee records linked optionally to a profile (user account).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE employees (
  id                        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                UUID         UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  shop_id                   UUID         NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  company_id                UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code             VARCHAR(20)  NOT NULL,
  first_name                VARCHAR(100) NOT NULL,
  last_name                 VARCHAR(100),
  phone                     VARCHAR(20),
  email                     VARCHAR(255),
  designation               VARCHAR(100),
  department                VARCHAR(100),
  date_of_joining           DATE,
  date_of_birth             DATE,
  address                   TEXT,
  emergency_contact_name    VARCHAR(100),
  emergency_contact_phone   VARCHAR(20),
  base_salary               DECIMAL(15,2) NOT NULL DEFAULT 0,
  bank_account_number       VARCHAR(50),
  bank_ifsc                 VARCHAR(20),
  bank_name                 VARCHAR(100),
  pan_number                VARCHAR(20),
  aadhar_number             VARCHAR(20),
  is_active                 BOOLEAN       NOT NULL DEFAULT true,
  notes                     TEXT,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT employees_code_company_unique UNIQUE (company_id, employee_code)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: attendance
-- Daily attendance record per employee.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE attendance (
  id            UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID              NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shop_id       UUID              NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  date          DATE              NOT NULL,
  status        attendance_status NOT NULL DEFAULT 'present',
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  working_hours DECIMAL(5,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT attendance_employee_date_unique UNIQUE (employee_id, date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: salary_records
-- Monthly salary disbursement records.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE salary_records (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shop_id         UUID          NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  month           SMALLINT      NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INTEGER       NOT NULL,
  working_days    INTEGER       NOT NULL DEFAULT 0,
  present_days    INTEGER       NOT NULL DEFAULT 0,
  base_salary     DECIMAL(15,2) NOT NULL DEFAULT 0,
  bonus           DECIMAL(15,2) NOT NULL DEFAULT 0,
  deductions      DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_salary      DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount     DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_date    DATE,
  payment_method  payment_method,
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  notes           TEXT,
  created_by      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT salary_records_employee_month_year_unique UNIQUE (employee_id, month, year)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: audit_logs
-- Immutable system-wide activity log for compliance and debugging.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id        UUID        REFERENCES shops(id) ON DELETE SET NULL,
  user_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action         VARCHAR(100) NOT NULL,
  resource_type  VARCHAR(100) NOT NULL,
  resource_id    UUID,
  old_values     JSONB,
  new_values     JSONB,
  ip_address     VARCHAR(45),
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Append-only audit trail. Never updated or deleted.';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: notifications
-- In-app notification queue. NULL user_id = broadcast to all in company.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID              NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id     UUID              REFERENCES shops(id) ON DELETE CASCADE,
  user_id     UUID              REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255)      NOT NULL,
  message     TEXT,
  data        JSONB             NOT NULL DEFAULT '{}',
  is_read     BOOLEAN           NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- Covering indexes for all common query patterns.
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles
CREATE INDEX idx_profiles_company_id   ON profiles(company_id);
CREATE INDEX idx_profiles_role         ON profiles(role);
CREATE INDEX idx_profiles_email        ON profiles(email);

-- shops
CREATE INDEX idx_shops_company_id      ON shops(company_id);
CREATE INDEX idx_shops_manager_id      ON shops(manager_id);
CREATE INDEX idx_shops_is_active       ON shops(is_active);

-- shop_staff
CREATE INDEX idx_shop_staff_shop_id    ON shop_staff(shop_id);
CREATE INDEX idx_shop_staff_profile_id ON shop_staff(profile_id);
CREATE INDEX idx_shop_staff_role       ON shop_staff(role);

-- categories
CREATE INDEX idx_categories_company_id ON categories(company_id);
CREATE INDEX idx_categories_parent_id  ON categories(parent_id);

-- products
CREATE INDEX idx_products_company_id   ON products(company_id);
CREATE INDEX idx_products_category_id  ON products(category_id);
CREATE INDEX idx_products_brand_id     ON products(brand_id);
CREATE INDEX idx_products_supplier_id  ON products(supplier_id);
CREATE INDEX idx_products_sku          ON products(sku);
CREATE INDEX idx_products_barcode      ON products(barcode);
CREATE INDEX idx_products_is_active    ON products(is_active);
CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX idx_products_tags         ON products USING gin(tags);

-- product_images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- inventory
CREATE INDEX idx_inventory_shop_id     ON inventory(shop_id);
CREATE INDEX idx_inventory_product_id  ON inventory(product_id);
CREATE INDEX idx_inventory_quantity    ON inventory(quantity);

-- inventory_transactions
CREATE INDEX idx_inv_txn_shop_id       ON inventory_transactions(shop_id);
CREATE INDEX idx_inv_txn_product_id    ON inventory_transactions(product_id);
CREATE INDEX idx_inv_txn_type          ON inventory_transactions(type);
CREATE INDEX idx_inv_txn_created_at    ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inv_txn_reference     ON inventory_transactions(reference_type, reference_id);

-- stock_alerts
CREATE INDEX idx_stock_alerts_shop_id      ON stock_alerts(shop_id);
CREATE INDEX idx_stock_alerts_product_id   ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_is_resolved  ON stock_alerts(is_resolved);

-- customers
CREATE INDEX idx_customers_company_id  ON customers(company_id);
CREATE INDEX idx_customers_shop_id     ON customers(shop_id);
CREATE INDEX idx_customers_phone       ON customers(phone);
CREATE INDEX idx_customers_email       ON customers(email);
CREATE INDEX idx_customers_group       ON customers(customer_group);
CREATE INDEX idx_customers_name_trgm   ON customers USING gin((first_name || ' ' || COALESCE(last_name, '')) gin_trgm_ops);

-- sales
CREATE INDEX idx_sales_shop_id         ON sales(shop_id);
CREATE INDEX idx_sales_customer_id     ON sales(customer_id);
CREATE INDEX idx_sales_invoice_number  ON sales(invoice_number);
CREATE INDEX idx_sales_sale_date       ON sales(sale_date DESC);
CREATE INDEX idx_sales_status          ON sales(status);
CREATE INDEX idx_sales_created_by      ON sales(created_by);

-- sale_items
CREATE INDEX idx_sale_items_sale_id    ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- payments
CREATE INDEX idx_payments_sale_id      ON payments(sale_id);
CREATE INDEX idx_payments_method       ON payments(method);

-- returns
CREATE INDEX idx_returns_shop_id          ON returns(shop_id);
CREATE INDEX idx_returns_original_sale_id ON returns(original_sale_id);
CREATE INDEX idx_returns_customer_id      ON returns(customer_id);

-- purchase_orders
CREATE INDEX idx_po_shop_id         ON purchase_orders(shop_id);
CREATE INDEX idx_po_supplier_id     ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status          ON purchase_orders(status);
CREATE INDEX idx_po_order_date      ON purchase_orders(order_date DESC);

-- purchase_order_items
CREATE INDEX idx_poi_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_poi_product_id        ON purchase_order_items(product_id);

-- supplier_payments
CREATE INDEX idx_sp_supplier_id        ON supplier_payments(supplier_id);
CREATE INDEX idx_sp_purchase_order_id  ON supplier_payments(purchase_order_id);

-- employees
CREATE INDEX idx_employees_company_id  ON employees(company_id);
CREATE INDEX idx_employees_shop_id     ON employees(shop_id);
CREATE INDEX idx_employees_profile_id  ON employees(profile_id);
CREATE INDEX idx_employees_is_active   ON employees(is_active);

-- attendance
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date        ON attendance(date DESC);
CREATE INDEX idx_attendance_shop_id     ON attendance(shop_id);

-- salary_records
CREATE INDEX idx_salary_records_employee_id ON salary_records(employee_id);
CREATE INDEX idx_salary_records_month_year  ON salary_records(year, month);

-- audit_logs
CREATE INDEX idx_audit_logs_company_id  ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource    ON audit_logs(resource_type, resource_id);

-- notifications
CREATE INDEX idx_notifications_user_id     ON notifications(user_id);
CREATE INDEX idx_notifications_company_id  ON notifications(company_id);
CREATE INDEX idx_notifications_is_read     ON notifications(is_read);
CREATE INDEX idx_notifications_created_at  ON notifications(created_at DESC);
