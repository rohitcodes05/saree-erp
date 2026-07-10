/**
 * Database types generated from the Supabase PostgreSQL schema.
 * Matches the exact table structure defined in migrations/001_initial_schema.sql
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'shop_manager' | 'cashier' | 'staff';

export type ExpenseCategory = 
  | 'utilities'
  | 'supplies'
  | 'transport'
  | 'maintenance'
  | 'marketing'
  | 'salary'
  | 'other';

export type InventoryTransactionType =
  | 'stock_in'
  | 'stock_out'
  | 'transfer_in'
  | 'transfer_out'
  | 'damage'
  | 'lost'
  | 'adjustment'
  | 'return';

export type SaleStatus =
  | 'draft'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'partially_returned';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'wallet' | 'exchange' | 'mixed';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'received'
  | 'partially_received'
  | 'cancelled';

export type NotificationType =
  | 'low_stock'
  | 'pending_payment'
  | 'new_order'
  | 'inventory_alert'
  | 'staff_alert'
  | 'system';

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';

export type GstRate = '0' | '5' | '12' | '18' | '28';

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export type CustomerGroup = 'regular' | 'silver' | 'gold' | 'platinum';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type SalaryStatus = 'pending' | 'paid' | 'partial';

export type ReturnCondition = 'good' | 'damaged' | 'unsellable';

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted';

export type CouponDiscountType = 'percentage' | 'fixed';

// ─── Base Types ───────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export interface Company extends BaseEntity {
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  pan_number: string | null;
  website: string | null;
  currency: string;
  currency_symbol: string;
  fiscal_year_start: number;
  timezone: string;
  is_active: boolean;
  settings: Record<string, unknown>;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: string;
  notifications: boolean;
  sidebar_collapsed: boolean;
}

export interface Profile extends BaseEntity {
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  preferences: UserPreferences;
}

export interface Shop extends BaseEntity {
  company_id: string;
  name: string;
  code: string;
  logo_url: string | null;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  opening_time: string;
  closing_time: string;
  manager_id: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
}

export interface ShopStaff extends BaseEntity {
  shop_id: string;
  profile_id: string;
  role: UserRole;
  is_active: boolean;
  joined_at: string;
}

export interface ShopSettings extends BaseEntity {
  shop_id: string;
  invoice_prefix: string;
  invoice_number_start: number;
  invoice_current_number: number;
  loyalty_points_per_rupee: number;
  loyalty_redemption_rate: number;
  min_redemption_points: number;
  tax_inclusive: boolean;
  enable_loyalty: boolean;
  enable_exchange: boolean;
  allow_negative_stock: boolean;
  auto_print_receipt: boolean;
  receipt_header: string | null;
  receipt_footer: string | null;
  whatsapp_enabled: boolean;
  whatsapp_phone: string | null;
  whatsapp_config: Record<string, unknown>;
  email_enabled: boolean;
  smtp_settings: Record<string, unknown>;
}

export interface Category extends BaseEntity {
  company_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Brand extends BaseEntity {
  company_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface Supplier extends BaseEntity {
  company_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  pan_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  opening_balance: number;
  credit_limit: number;
  credit_days: number;
  is_active: boolean;
  notes: string | null;
}

export interface Product extends BaseEntity {
  company_id: string;
  category_id: string | null;
  brand_id: string | null;
  supplier_id: string | null;
  // Identification
  sku: string;
  barcode: string | null;
  qr_code: string | null;
  // Basic
  name: string;
  description: string | null;
  // Saree Attributes
  fabric: string | null;
  weaving_type: string | null;
  occasion: string | null;
  sleeve_type: string | null;
  border_type: string | null;
  pattern: string | null;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  weight_grams: number | null;
  // Pricing
  purchase_price: number;
  selling_price: number;
  mrp: number | null;
  discount_percent: number;
  gst_rate: GstRate;
  is_tax_inclusive: boolean;
  // Status
  is_active: boolean;
  is_featured: boolean;
  // Metadata
  tags: string[];
  rack_number: string | null;
  minimum_stock: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Inventory extends BaseEntity {
  shop_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  minimum_stock: number;
  rack_number: string | null;
  last_stock_update: string;
}

export interface InventoryTransaction {
  id: string;
  shop_id: string;
  product_id: string;
  type: InventoryTransactionType;
  quantity: number;
  quantity_before: number | null;
  quantity_after: number | null;
  reference_type: string | null;
  reference_id: string | null;
  destination_shop_id: string | null;
  unit_cost: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  shop_id: string;
  product_id: string;
  current_stock: number;
  minimum_stock: number;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface Customer extends BaseEntity {
  company_id: string;
  shop_id: string | null;
  first_name: string;
  last_name: string | null;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  date_of_birth: string | null;
  anniversary_date: string | null;
  gender: string | null;
  loyalty_points: number;
  total_purchases: number;
  total_visits: number;
  last_visit: string | null;
  customer_group: CustomerGroup;
  whatsapp_opt_in: boolean;
  email_opt_in: boolean;
  notes: string | null;
  tags: string[];
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  shop_id: string;
  points: number;
  type: LoyaltyTransactionType;
  reference_type: string | null;
  reference_id: string | null;
  balance_after: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Coupon extends BaseEntity {
  company_id: string;
  shop_id: string | null;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  minimum_purchase: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_customer_limit: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  applicable_categories: string[] | null;
}

export interface Sale extends BaseEntity {
  shop_id: string;
  invoice_number: string;
  customer_id: string | null;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  coupon_id: string | null;
  coupon_discount: number;
  taxable_amount: number;
  gst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  loyalty_points_used: number;
  loyalty_discount: number;
  loyalty_points_earned: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  change_amount: number;
  status: SaleStatus;
  payment_status: PaymentStatus;
  created_by: string | null;
  notes: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_barcode: string | null;
  quantity: number;
  unit_price: number;
  purchase_price: number | null;
  discount_percent: number;
  discount_amount: number;
  gst_rate: GstRate;
  gst_amount: number;
  total_amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  method: PaymentMethod;
  amount: number;
  reference_number: string | null;
  status: PaymentStatus;
  gateway_response: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export interface Return extends BaseEntity {
  shop_id: string;
  original_sale_id: string;
  return_number: string;
  customer_id: string | null;
  return_date: string;
  reason: string | null;
  refund_amount: number;
  refund_method: PaymentMethod | null;
  restocked: boolean;
  status: ReturnStatus;
  processed_by: string | null;
  notes: string | null;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  refund_amount: number;
  condition: ReturnCondition;
  created_at: string;
}

export interface PurchaseOrder extends BaseEntity {
  shop_id: string;
  supplier_id: string;
  po_number: string;
  order_date: string;
  expected_delivery_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  created_by: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_cost: number;
  total_cost: number;
  gst_rate: GstRate;
  gst_amount: number;
  created_at: string;
}

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Employee extends BaseEntity {
  profile_id: string | null;
  shop_id: string;
  company_id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  base_salary: number;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  pan_number: string | null;
  aadhar_number: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface Attendance extends BaseEntity {
  employee_id: string;
  shop_id: string;
  date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  notes: string | null;
}

export interface SalaryRecord extends BaseEntity {
  employee_id: string;
  shop_id: string;
  month: number;
  year: number;
  working_days: number;
  present_days: number;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_salary: number;
  paid_amount: number;
  payment_date: string | null;
  payment_method: PaymentMethod | null;
  status: SalaryStatus;
  notes: string | null;
  created_by: string | null;
}

export interface AuditLog {
  id: string;
  company_id: string;
  shop_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id: string;
  shop_id: string | null;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  shop_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  expense_date: string;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── View Types ───────────────────────────────────────────────────────────────

export interface InventoryStatusView {
  id: string;
  shop_id: string;
  shop_name: string;
  company_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  category_name: string | null;
  fabric: string | null;
  color: string | null;
  selling_price: number;
  purchase_price: number;
  gst_rate: GstRate;
  quantity: number;
  minimum_stock: number;
  rack_number: string | null;
  inventory_value: number;
  stock_status: StockStatus;
  last_stock_update: string;
  updated_at: string;
}

export interface DailySalesSummaryView {
  shop_id: string;
  shop_name: string;
  company_id: string;
  sale_date: string;
  total_transactions: number;
  total_revenue: number;
  total_discounts: number;
  total_gst: number;
  total_cgst: number;
  total_sgst: number;
  avg_transaction_value: number;
  unique_customers: number;
  outstanding_amount: number;
}

// ─── Supabase Database Schema Type ────────────────────────────────────────────
// Used with createClient<Database>() for full type safety.

export interface Database {
  public: {
    Tables: {
      companies:              { Row: Company; Insert: Partial<Company>; Update: Partial<Company>; Relationships: any[] };
      profiles:               { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: any[] };
      shops:                  { Row: Shop; Insert: Partial<Shop>; Update: Partial<Shop>; Relationships: any[] };
      shop_staff:             { Row: ShopStaff; Insert: Partial<ShopStaff>; Update: Partial<ShopStaff>; Relationships: any[] };
      shop_settings:          { Row: ShopSettings; Insert: Partial<ShopSettings>; Update: Partial<ShopSettings>; Relationships: any[] };
      categories:             { Row: Category; Insert: Partial<Category>; Update: Partial<Category>; Relationships: any[] };
      brands:                 { Row: Brand; Insert: Partial<Brand>; Update: Partial<Brand>; Relationships: any[] };
      suppliers:              { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier>; Relationships: any[] };
      products:               { Row: Product; Insert: Partial<Product>; Update: Partial<Product>; Relationships: any[] };
      product_images:         { Row: ProductImage; Insert: Partial<ProductImage>; Update: Partial<ProductImage>; Relationships: any[] };
      inventory:              { Row: Inventory; Insert: Partial<Inventory>; Update: Partial<Inventory>; Relationships: any[] };
      inventory_transactions: { Row: InventoryTransaction; Insert: Partial<InventoryTransaction>; Update: Partial<InventoryTransaction>; Relationships: any[] };
      stock_alerts:           { Row: StockAlert; Insert: Partial<StockAlert>; Update: Partial<StockAlert>; Relationships: any[] };
      customers:              { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer>; Relationships: any[] };
      loyalty_transactions:   { Row: LoyaltyTransaction; Insert: Partial<LoyaltyTransaction>; Update: Partial<LoyaltyTransaction>; Relationships: any[] };
      coupons:                { Row: Coupon; Insert: Partial<Coupon>; Update: Partial<Coupon>; Relationships: any[] };
      sales:                  { Row: Sale; Insert: Partial<Sale>; Update: Partial<Sale>; Relationships: any[] };
      sale_items:             { Row: SaleItem; Insert: Partial<SaleItem>; Update: Partial<SaleItem>; Relationships: any[] };
      payments:               { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment>; Relationships: any[] };
      returns:                { Row: Return; Insert: Partial<Return>; Update: Partial<Return>; Relationships: any[] };
      return_items:           { Row: ReturnItem; Insert: Partial<ReturnItem>; Update: Partial<ReturnItem>; Relationships: any[] };
      purchase_orders:        { Row: PurchaseOrder; Insert: Partial<PurchaseOrder>; Update: Partial<PurchaseOrder>; Relationships: any[] };
      purchase_order_items:   { Row: PurchaseOrderItem; Insert: Partial<PurchaseOrderItem>; Update: Partial<PurchaseOrderItem>; Relationships: any[] };
      supplier_payments:      { Row: SupplierPayment; Insert: Partial<SupplierPayment>; Update: Partial<SupplierPayment>; Relationships: any[] };
      employees:              { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee>; Relationships: any[] };
      attendance:             { Row: Attendance; Insert: Partial<Attendance>; Update: Partial<Attendance>; Relationships: any[] };
      salary_records:         { Row: SalaryRecord; Insert: Partial<SalaryRecord>; Update: Partial<SalaryRecord>; Relationships: any[] };
      expenses:               { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense>; Relationships: any[] };
      audit_logs:             { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog>; Relationships: any[] };
      notifications:          { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification>; Relationships: any[] };
    };
    Views: {
      v_inventory_status:     { Row: InventoryStatusView; Relationships: any[] };
      v_daily_sales_summary:  { Row: DailySalesSummaryView; Relationships: any[] };
    };
    Functions: {
      generate_invoice_number: { Args: { p_shop_id: string }; Returns: string };
      generate_po_number:      { Args: { p_shop_id: string }; Returns: string };
      search_products:         { Args: { p_query: string; p_shop_id?: string; p_limit?: number; p_offset?: number }; Returns: unknown[] };
      search_customers:        { Args: { p_query: string; p_limit?: number }; Returns: unknown[] };
      update_last_login:       { Args: Record<string, never>; Returns: void };
      log_audit_event:         { Args: { p_action: string; p_resource_type: string; p_resource_id?: string; p_old_values?: unknown; p_new_values?: unknown; p_shop_id?: string }; Returns: void };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
