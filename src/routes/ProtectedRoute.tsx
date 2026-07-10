import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui';
import { PUBLIC_ROUTES } from '@/constants/routes';
import type { UserRole } from '@/types';

// ─── Protected Route ─────────────────────────────────────────────────────────
// Guards authenticated-only pages (dashboard, shops, POS, etc.)

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = PUBLIC_ROUTES.LOGIN,
}) => {
  const location = useLocation();
  // Subscribe only to the three fields we need — no unnecessary re-renders
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user          = useAuthStore((s) => s.user);

  // Wait for the first session check to complete
  if (!isInitialized) {
    return <PageLoader message="Authenticating…" />;
  }

  // No user → send to login
  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Account deactivated
  if (!user.profile.is_active) {
    return (
      <Navigate
        to={redirectTo}
        state={{ reason: 'account_inactive' }}
        replace
      />
    );
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// ─── Guest Route ─────────────────────────────────────────────────────────────
// Guards public pages (login). Redirects authenticated users to dashboard.

export const GuestRoute: React.FC = () => {
  const location      = useLocation();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user          = useAuthStore((s) => s.user);

  // Wait for session check — show a brief blank/loader
  if (!isInitialized) {
    return <PageLoader message="Loading…" />;
  }

  // Already logged in → go to dashboard (or wherever they came from)
  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Not logged in → show login page
  return <Outlet />;
};
