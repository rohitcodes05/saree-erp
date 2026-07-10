// ─── Public Routes (no auth required) ────────────────────────────────────────
export const PUBLIC_ROUTES = {
  LOGIN:          '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

// ─── Protected Routes ─────────────────────────────────────────────────────────
export const ROUTES = {
  // Dashboard
  DASHBOARD:      '/dashboard',

  // Shops
  SHOPS:          '/shops',
  SHOP_DETAIL:    '/shops/:shopId',
  SHOP_NEW:       '/shops/new',
  SHOP_EDIT:      '/shops/:shopId/edit',

  // Products
  PRODUCTS:       '/products',
  PRODUCT_DETAIL: '/products/:productId',
  PRODUCT_NEW:    '/products/new',
  PRODUCT_EDIT:   '/products/:productId/edit',

  // Inventory
  INVENTORY:      '/inventory',
  INVENTORY_SHOP: '/inventory/:shopId',
  STOCK_IN:       '/inventory/stock-in',
  STOCK_OUT:      '/inventory/stock-out',
  STOCK_TRANSFER: '/inventory/transfer',

  // POS
  POS:            '/pos',
  POS_SHOP:       '/pos/:shopId',

  // Customers
  CUSTOMERS:      '/customers',
  CUSTOMER_DETAIL: '/customers/:customerId',
  CUSTOMER_NEW:   '/customers/new',

  // Suppliers
  SUPPLIERS:      '/suppliers',
  SUPPLIER_DETAIL: '/suppliers/:supplierId',
  PURCHASE_ORDERS: '/suppliers/orders',
  PO_DETAIL:      '/suppliers/orders/:orderId',

  // Employees
  EMPLOYEES:      '/employees',
  EMPLOYEE_DETAIL: '/employees/:employeeId',
  ATTENDANCE:     '/employees/attendance',
  SALARY:         '/employees/salary',

  // Reports
  REPORTS:        '/reports',
  REPORT_SALES:   '/reports/sales',
  REPORT_INVENTORY: '/reports/inventory',
  REPORT_GST:     '/reports/gst',
  REPORT_CUSTOMERS: '/reports/customers',

  // Settings
  SETTINGS:       '/settings',
  SETTINGS_COMPANY: '/settings/company',
  SETTINGS_SHOPS: '/settings/shops',
  SETTINGS_BILLING: '/settings/billing',
  SETTINGS_USERS: '/settings/users',

  // Notifications
  NOTIFICATIONS:  '/notifications',
} as const;

// ─── Route Helpers ────────────────────────────────────────────────────────────

export function shopDetailRoute(shopId: string): string {
  return ROUTES.SHOP_DETAIL.replace(':shopId', shopId);
}

export function productDetailRoute(productId: string): string {
  return ROUTES.PRODUCT_DETAIL.replace(':productId', productId);
}

export function productEditRoute(productId: string): string {
  return ROUTES.PRODUCT_EDIT.replace(':productId', productId);
}

export function customerDetailRoute(customerId: string): string {
  return ROUTES.CUSTOMER_DETAIL.replace(':customerId', customerId);
}

export function supplierDetailRoute(supplierId: string): string {
  return ROUTES.SUPPLIER_DETAIL.replace(':supplierId', supplierId);
}

export function employeeDetailRoute(employeeId: string): string {
  return ROUTES.EMPLOYEE_DETAIL.replace(':employeeId', employeeId);
}

export function posShopRoute(shopId: string): string {
  return ROUTES.POS_SHOP.replace(':shopId', shopId);
}

export function inventoryShopRoute(shopId: string): string {
  return ROUTES.INVENTORY_SHOP.replace(':shopId', shopId);
}
