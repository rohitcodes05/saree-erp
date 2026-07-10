import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { PageLoader, Spinner } from '@/components/ui';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute';

// ─── Lazy Imports ─────────────────────────────────────────────────────────────

const LoginPage       = lazy(() => import('@/features/auth/components/LoginPage'));
const SignUpPage      = lazy(() => import('@/features/auth/components/SignUpPage').then(module => ({ default: module.SignUpPage })));
const AppLayout       = lazy(() => import('@/layouts/AppLayout'));
const DashboardPage   = lazy(() => import('@/features/dashboard/DashboardPage'));
const ShopsPage       = lazy(() => import('@/features/shops/ShopsPage'));
const ShopDetailPage  = lazy(() => import('@/features/shops/ShopDetailPage'));
const ProductsPage    = lazy(() => import('@/features/products/ProductsPage'));
const InventoryPage   = lazy(() => import('@/features/inventory/InventoryPage'));
const POSPage         = lazy(() => import('@/features/pos/POSPage'));
const CustomersPage   = lazy(() => import('@/features/customers/CustomersPage'));
const SuppliersPage   = lazy(() => import('@/features/suppliers/SuppliersPage'));
const EmployeesPage   = lazy(() => import('@/features/employees/EmployeesPage'));
const ReportsPage     = lazy(() => import('@/features/reports/ReportsPage'));
const SettingsPage    = lazy(() => import('@/features/settings/SettingsPage'));
const ExpensesPage    = lazy(() => import('@/features/expenses/ExpensesPage').then(module => ({ default: module.ExpensesPage })));
const ReturnsPage     = lazy(() => import('@/features/returns/ReturnsPage').then(module => ({ default: module.ReturnsPage })));
const SalesPage       = lazy(() => import('@/features/sales/SalesPage').then(module => ({ default: module.SalesPage })));

// ─── Suspense Wrapper ─────────────────────────────────────────────────────────

const SuspensePage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    }
  >
    {children}
  </Suspense>
);

// ─── 404 Page ─────────────────────────────────────────────────────────────────

const NotFoundPage: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
    <div className="text-8xl font-bold text-surface-3">404</div>
    <h1 className="text-2xl font-semibold text-text">Page Not Found</h1>
    <p className="text-text-muted text-sm">
      The page you&apos;re looking for doesn&apos;t exist.
    </p>
    <a
      href="/dashboard"
      className="text-primary hover:text-primary-400 text-sm font-medium transition-colors"
    >
      Go to Dashboard →
    </a>
  </div>
);

const UnauthorizedPage: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
    <div className="text-8xl font-bold text-surface-3">403</div>
    <h1 className="text-2xl font-semibold text-text">Access Denied</h1>
    <p className="text-text-muted text-sm">
      You don&apos;t have permission to access this page.
    </p>
    <a
      href="/dashboard"
      className="text-primary hover:text-primary-400 text-sm font-medium transition-colors"
    >
      Go to Dashboard →
    </a>
  </div>
);

// ─── Router Definition ────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    // ── Public / Guest Routes ────────────────────────────────────────────────
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/signup',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SignUpPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    // ── Protected Routes ─────────────────────────────────────────────────────
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </Suspense>
        ),
        children: [
          // Default redirect
          { path: '/', element: <Navigate to="/dashboard" replace /> },

          // Dashboard
          {
            path: '/dashboard',
            element: <SuspensePage><DashboardPage /></SuspensePage>,
          },

          // Shops (super_admin only)
          {
            element: <ProtectedRoute allowedRoles={['super_admin']} />,
            children: [
              {
                path: '/shops',
                element: <SuspensePage><ShopsPage /></SuspensePage>,
              },
              {
                path: '/shops/:shopId',
                element: <SuspensePage><ShopDetailPage /></SuspensePage>,
              },
            ],
          },

          // Products
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager', 'staff', 'cashier']} />,
            children: [
              {
                path: '/products',
                element: <SuspensePage><ProductsPage /></SuspensePage>,
              },
            ],
          },

          // Inventory
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager', 'staff', 'cashier']} />,
            children: [
              {
                path: '/inventory',
                element: <SuspensePage><InventoryPage /></SuspensePage>,
              },
            ],
          },

          // POS
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager', 'cashier']} />,
            children: [
              {
                path: '/pos',
                element: <SuspensePage><POSPage /></SuspensePage>,
              },
            ],
          },

          // Customers
          {
            path: '/customers',
            element: <SuspensePage><CustomersPage /></SuspensePage>,
          },

          // Suppliers (super_admin, shop_manager)
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager']} />,
            children: [
              {
                path: '/suppliers',
                element: <SuspensePage><SuppliersPage /></SuspensePage>,
              },
            ],
          },

          // Employees (super_admin, shop_manager)
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager']} />,
            children: [
              {
                path: '/employees',
                element: <SuspensePage><EmployeesPage /></SuspensePage>,
              },
            ],
          },

          // Sales History
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager', 'cashier']} />,
            children: [
              {
                path: '/sales',
                element: <SuspensePage><SalesPage /></SuspensePage>,
              },
            ],
          },

          // Expenses
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager', 'cashier']} />,
            children: [
              {
                path: '/expenses',
                element: <SuspensePage><ExpensesPage /></SuspensePage>,
              },
            ],
          },

          // Returns
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager', 'cashier']} />,
            children: [
              {
                path: '/returns',
                element: <SuspensePage><ReturnsPage /></SuspensePage>,
              },
            ],
          },

          // Reports
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'shop_manager']} />,
            children: [
              {
                path: '/reports',
                element: <SuspensePage><ReportsPage /></SuspensePage>,
              },
              {
                path: '/reports/:section',
                element: <SuspensePage><ReportsPage /></SuspensePage>,
              },
            ],
          },

          // Settings
          {
            path: '/settings',
            element: <SuspensePage><SettingsPage /></SuspensePage>,
          },
          {
            path: '/settings/:section',
            element: <SuspensePage><SettingsPage /></SuspensePage>,
          },
        ],
      },
    ],
  },

  // ── Error / Special ───────────────────────────────────────────────────────
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*',             element: <NotFoundPage /> },
]);

// ─── Router Provider ──────────────────────────────────────────────────────────

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
