import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';
import type { Shop } from '@/types/database.types';

// ─── State Interface ──────────────────────────────────────────────────────────

interface AuthStore {
  // State
  user: AuthUser | null;
  activeShop: Shop | null;
  isInitialized: boolean; // true once the first session check completes

  // Actions
  setUser: (user: AuthUser | null) => void;
  setActiveShop: (shop: Shop | null) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;

  // Computed getters (derived)
  companyId: string | null;
  isSuperAdmin: boolean;
  isShopManager: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial state ────────────────────────────────────────────────────
        user:          null,
        activeShop:    null,
        isInitialized: false,

        // ── Actions ──────────────────────────────────────────────────────────

        setUser: (user) => {
          set({ user }, false, 'auth/setUser');

          // Auto-select the first available shop if none is active
          const currentShop = get().activeShop;
          if (user && !currentShop && user.assignedShops.length > 0) {
            set({ activeShop: user.assignedShops[0] }, false, 'auth/autoSelectShop');
          }
          if (!user) {
            set({ activeShop: null }, false, 'auth/clearShop');
          }
        },

        setActiveShop: (shop) =>
          set({ activeShop: shop }, false, 'auth/setActiveShop'),

        setInitialized: (isInitialized) =>
          set({ isInitialized }, false, 'auth/setInitialized'),

        reset: () =>
          set(
            { user: null, activeShop: null, isInitialized: true },
            false,
            'auth/reset'
          ),

        // ── Computed (derived from user) ─────────────────────────────────────
        get companyId() {
          return get().user?.profile.company_id ?? null;
        },

        get isSuperAdmin() {
          return get().user?.profile.role === 'super_admin';
        },

        get isShopManager() {
          return ['super_admin', 'shop_manager'].includes(
            get().user?.profile.role ?? ''
          );
        },
      }),
      {
        name: 'saree-erp-store',
        // ONLY persist the activeShop preference.
        // user and isInitialized must NEVER be persisted:
        //   - user: re-fetched fresh from Supabase on every load
        //   - isInitialized: must always start as false so routes wait for init
        partialize: (state) => ({
          activeShop: state.activeShop,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// ─── Convenience hook (subscribes only to what you need) ─────────────────────

export function useAuth() {
  return useAuthStore((s) => ({
    user:          s.user,
    activeShop:    s.activeShop,
    isInitialized: s.isInitialized,
    companyId:     s.user?.profile.company_id ?? null,
    isSuperAdmin:  s.user?.profile.role === 'super_admin',
    isShopManager: ['super_admin', 'shop_manager'].includes(s.user?.profile.role ?? ''),
    assignedShops: s.user?.assignedShops ?? [],
    setActiveShop: s.setActiveShop,
    canAccessShop: (shopId: string) => {
      if (!s.user) return false;
      if (s.user.profile.role === 'super_admin') return true;
      return s.user.assignedShops.some((sh) => sh.id === shopId);
    },
  }));
}
