import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { signIn, signOut, getDefaultRoute } from '@/lib/auth';
import type { LoginCredentials } from '@/types/auth';
import type { UserRole, Permission } from '@/types';
import { hasPermission } from '@/constants/roles';

// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Selective subscription — only subscribes to fields that are used.
// This prevents unnecessary re-renders when unrelated store state changes.

export function useAuth() {
  const navigate = useNavigate();

  const user          = useAuthStore((s) => s.user);
  const activeShop    = useAuthStore((s) => s.activeShop);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const setUser       = useAuthStore((s) => s.setUser);
  const setActiveShop = useAuthStore((s) => s.setActiveShop);
  const reset         = useAuthStore((s) => s.reset);

  // Derived from user — computed inline, not stored
  const role        = user?.profile.role;
  const companyId   = user?.profile.company_id ?? null;
  const isSuperAdmin  = role === 'super_admin';
  const isShopManager = role === 'super_admin' || role === 'shop_manager';
  const isCashier     = role === 'cashier' || role === 'staff';
  const canViewProfits = isSuperAdmin || isShopManager;

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await signIn(credentials);

      if (!result.success || !result.user) {
        return { success: false, error: result.error };
      }

      setUser(result.user);

      const redirectPath = getDefaultRoute(result.user);
      navigate(redirectPath, { replace: true });

      toast.success(`Welcome back, ${result.user.profile.first_name}!`, {
        duration: 3000,
      });

      return { success: true };
    },
    [navigate, setUser]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await signOut();
    reset();
    navigate('/login', { replace: true });
    toast.success('You have been logged out.');
  }, [navigate, reset]);

  // ── Permission Check ───────────────────────────────────────────────────────

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return hasPermission(user.profile.role, permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.profile.role);
    },
    [user]
  );

  const canAccessShop = useCallback(
    (shopId: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      return user.assignedShops.some((s) => s.id === shopId);
    },
    [user, isSuperAdmin]
  );

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    user,
    activeShop,
    isInitialized,

    // Computed
    isAuthenticated:  !!user,
    isSuperAdmin,
    isShopManager,
    isCashier,
    canViewProfits,
    role,
    companyId,
    profile:          user?.profile,
    company:          user?.company,
    assignedShops:    user?.assignedShops ?? [],

    // Actions
    login,
    logout,
    setActiveShop,
    canAccessShop,
    can,
    hasRole,
  };
}
