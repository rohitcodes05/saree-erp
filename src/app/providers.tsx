import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { getCurrentSession, onAuthStateChange } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { initializeTheme } from '@/store/themeStore';
import '@/i18n/config';

// ─── TanStack Query Client ────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime:    1000 * 60 * 10,
      retry: (failureCount, error) => {
        if ((error as { status?: number })?.status === 401) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Auth Initializer ─────────────────────────────────────────────────────────
// Runs ONCE on mount. Reads Supabase session, sets user, then marks initialized.
// Uses direct store.getState() calls — NOT hooks — so no re-render loop possible.

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read notifications action directly — stable reference, won't cause re-renders
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    initializeTheme();

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        // Fetch current session from Supabase
        const user = await getCurrentSession();

        // Write to store via getState() — bypasses React render cycle entirely
        useAuthStore.getState().setUser(user);

        if (user) {
          fetchNotifications();
        }

        // Subscribe to future auth events (token refresh, sign-out from another tab)
        unsubscribe = onAuthStateChange((authUser) => {
          useAuthStore.getState().setUser(authUser);
          if (authUser) fetchNotifications();
        });
      } catch (err) {
        console.error('[App] Auth initialization failed:', err);
        useAuthStore.getState().setUser(null);
      } finally {
        // Mark initialized — this triggers route guards to show login or dashboard
        useAuthStore.getState().setInitialized(true);
      }
    };

    init();

    return () => unsubscribe?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

// ─── Toast Config ─────────────────────────────────────────────────────────────

const toastOptions = {
  style: {
    background: '#18181b',
    color: '#fafafa',
    border: '1px solid #27272a',
    borderRadius: '12px',
    fontSize: '14px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.5)',
  },
  success: {
    iconTheme: { primary: '#22c55e', secondary: '#18181b' },
    duration: 3000,
  },
  error: {
    iconTheme: { primary: '#ef4444', secondary: '#18181b' },
    duration: 5000,
  },
};

// ─── App Providers ────────────────────────────────────────────────────────────

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthInitializer>
      {children}
    </AuthInitializer>

    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={toastOptions}
    />

    {import.meta.env.VITE_APP_ENV === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )}
  </QueryClientProvider>
);

export default AppProviders;
