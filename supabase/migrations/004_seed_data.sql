-- ============================================================
-- SAREE ERP – SEED DATA
-- Migration: 004_seed_data.sql
-- Description: Demo company, categories, brands, and super admin setup.
-- NOTE: The super admin user must be created via Supabase Auth first.
--       Then update the profile with the company_id generated here.
-- ============================================================

-- ─── Demo Company ────────────────────────────────────────────────────────────
INSERT INTO companies (
  id, name, logo_url, address,
  phone, email, gst_number, pan_number,
  currency, currency_symbol, fiscal_year_start, timezone
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Lakshmi Silks & Sarees',
  NULL,
  '45, Pondy Bazaar, T. Nagar',
  '+91 98400 12345',
  'admin@example.com',
  '33AABCL1234A1ZS',
  'AABCL1234A',
  'INR',
  '₹',
  4,
  'Asia/Kolkata'
) ON CONFLICT DO NOTHING;

-- ─── Demo Shops ──────────────────────────────────────────────────────────────
INSERT INTO shops (
  id, company_id, name, code, address, city, state, pincode, phone, gst_number
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'T. Nagar Flagship',
    'TNG01',
    '45, Pondy Bazaar, T. Nagar',
    'Chennai', 'Tamil Nadu', '600017', '+91 98400 11111',
    '33AABCL1234A1ZS'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Anna Nagar Branch',
    'ANN02',
    '12, 3rd Avenue, Anna Nagar',
    'Chennai', 'Tamil Nadu', '600040', '+91 98400 22222',
    '33AABCL1234A2ZS'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Coimbatore Store',
    'CBE03',
    '78, DB Road, R.S. Puram',
    'Coimbatore', 'Tamil Nadu', '641002', '+91 98400 33333',
    '33AABCL1234A3ZS'
  )
ON CONFLICT DO NOTHING;

-- ─── Categories ──────────────────────────────────────────────────────────────
INSERT INTO categories (id, company_id, name, slug, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Silk',       'silk',       1),
  ('c0000001-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Cotton',     'cotton',     2),
  ('c0000001-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Linen',      'linen',      3),
  ('c0000001-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Chiffon',    'chiffon',    4),
  ('c0000001-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Georgette',  'georgette',  5),
  ('c0000001-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Organza',    'organza',    6),
  ('c0000001-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Bridal',     'bridal',     7),
  ('c0000001-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Designer',   'designer',   8),
  ('c0000001-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Casual',     'casual',     9),
  ('c0000001-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Party Wear', 'party-wear', 10)
ON CONFLICT DO NOTHING;

-- Sub-categories under Silk
INSERT INTO categories (id, company_id, parent_id, name, slug, sort_order) VALUES
  ('c0000002-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Banarasi',   'banarasi',   1),
  ('c0000002-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Kanjivaram', 'kanjivaram', 2),
  ('c0000002-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Paithani',   'paithani',   3),
  ('c0000002-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Mysore Silk','mysore-silk', 4),
  ('c0000002-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Chanderi',   'chanderi',   5)
ON CONFLICT DO NOTHING;

-- ─── Brands ──────────────────────────────────────────────────────────────────
INSERT INTO brands (company_id, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Kankatala'),
  ('a0000000-0000-0000-0000-000000000001', 'Pothys'),
  ('a0000000-0000-0000-0000-000000000001', 'Nalli'),
  ('a0000000-0000-0000-0000-000000000001', 'Kumaran Silks'),
  ('a0000000-0000-0000-0000-000000000001', 'RmKV'),
  ('a0000000-0000-0000-0000-000000000001', 'Sundari Silks'),
  ('a0000000-0000-0000-0000-000000000001', 'VGP'),
  ('a0000000-0000-0000-0000-000000000001', 'Unbranded')
ON CONFLICT DO NOTHING;

-- ─── Sample Suppliers ─────────────────────────────────────────────────────────
INSERT INTO suppliers (company_id, name, contact_person, phone, city, state, credit_days) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Varanasi Weaves Co.',    'Ramesh Kumar',  '+91 94100 11111', 'Varanasi',   'Uttar Pradesh', 45),
  ('a0000000-0000-0000-0000-000000000001', 'Kanchipuram Silks Ltd.', 'Murugan R.',    '+91 94100 22222', 'Kanchipuram','Tamil Nadu',    30),
  ('a0000000-0000-0000-0000-000000000001', 'Surat Textiles Hub',     'Priya Shah',    '+91 94100 33333', 'Surat',      'Gujarat',        60),
  ('a0000000-0000-0000-0000-000000000001', 'Pochampally Ikat House', 'Venkat Rao',   '+91 94100 44444', 'Hyderabad',  'Telangana',      30)
ON CONFLICT DO NOTHING;

-- ─── Coupons ──────────────────────────────────────────────────────────────────
INSERT INTO coupons (company_id, code, description, discount_type, discount_value, minimum_purchase, valid_until) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'WELCOME10',  '10% off for new customers',      'percentage', 10,   500,  NOW() + INTERVAL '1 year'),
  ('a0000000-0000-0000-0000-000000000001', 'FLAT500',    '₹500 off on purchase above ₹5000','fixed',      500,  5000, NOW() + INTERVAL '6 months'),
  ('a0000000-0000-0000-0000-000000000001', 'BRIDAL20',   '20% off on bridal collection',   'percentage', 20,   10000, NOW() + INTERVAL '3 months')
ON CONFLICT DO NOTHING;

-- ─── GST Rate Reference (informational comment) ───────────────────────────────
-- Saree GST rates as per Indian GST law (as of FY 2024-25):
--   Cotton sarees          : 5%
--   Silk sarees            : 5%
--   Man-made fiber sarees  : 12%
--   Embroidered/designer   : 12% or 18%
-- The system stores gst_rate per product for accurate billing.

-- ─── Note on Super Admin Setup ───────────────────────────────────────────────
-- After running this seed:
-- 1. Create a user via Supabase Auth Dashboard (Authentication → Users → Add User)
--    Email: admin@example.com  Password: (set a strong password)
-- 2. The trigger will auto-create a profile row.
-- 3. Update the profile to link company and set role:
--
-- UPDATE profiles
-- SET
--   company_id = 'a0000000-0000-0000-0000-000000000001',
--   role = 'super_admin',
--   first_name = 'Admin',
--   last_name = 'User'
-- WHERE email = 'admin@example.com';
--
-- The README has full step-by-step setup instructions.
