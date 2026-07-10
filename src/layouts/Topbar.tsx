import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, ChevronDown, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useThemeStore } from '@/store/themeStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar, Badge } from '@/components/ui';
import { supabase, rpc } from '@/lib/supabase';

// ─── Global Search Bar ────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'sale';
  title: string;
  subtitle?: string;
  href: string;
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Search products
        const { data: products } = await rpc<{
          id: string; name: string; sku: string; barcode: string | null;
        }[]>('search_products', { p_query: query, p_limit: 5 });

        // Search customers
        const { data: customers } = await rpc<{
          id: string; first_name: string; last_name: string | null; phone: string;
        }[]>('search_customers', { p_query: query, p_limit: 5 });

        // Search invoices
        const { data: sales } = await supabase
          .from('sales')
          .select('id, invoice_number, total_amount')
          .ilike('invoice_number', `%${query}%`)
          .limit(3);

        const newResults: SearchResult[] = [
          ...(products ?? []).map(p => ({
            id: p.id,
            type: 'product' as const,
            title: p.name,
            subtitle: `SKU: ${p.sku}${p.barcode ? ` · ${p.barcode}` : ''}`,
            href: `/products/${p.id}`,
          })),
          ...(customers ?? []).map(c => ({
            id: c.id,
            type: 'customer' as const,
            title: `${c.first_name} ${c.last_name ?? ''}`.trim(),
            subtitle: c.phone,
            href: `/customers/${c.id}`,
          })),
          ...(sales ?? []).map((s: any) => ({
            id: s.id,
            type: 'sale' as const,
            title: s.invoice_number,
            subtitle: 'Invoice',
            href: `/pos?invoice=${s.invoice_number}`,
          })),
        ];

        setResults(newResults);
        setIsOpen(newResults.length > 0);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const typeColors: Record<string, string> = {
    product: 'text-primary bg-primary/10',
    customer: 'text-success bg-success/10',
    sale: 'text-warning bg-warning/10',
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder="Search products, customers, invoices…"
          className={cn(
            'w-full h-9 pl-9 pr-16 rounded-xl bg-surface-2 border border-border',
            'text-sm text-text placeholder:text-text-muted/60',
            'outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            'transition-all duration-150'
          )}
        />
        <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 rounded border border-border px-1.5 text-[10px] text-text-muted font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-surface-1 border border-border rounded-xl shadow-surface-xl z-50 overflow-hidden"
          >
            {results.map(result => (
              <button
                key={result.id}
                onClick={() => {
                  navigate(result.href);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 transition-colors"
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0',
                    typeColors[result.type]
                  )}
                >
                  {result.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-text-muted truncate">
                      {result.subtitle}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {isLoading && (
              <div className="px-4 py-3 text-sm text-text-muted">
                Searching…
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Notification Bell ────────────────────────────────────────────────────────

const NotificationBell: React.FC = () => {
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-xl text-text-muted hover:text-text',
          'hover:bg-surface-2 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-surface-1 border border-border rounded-2xl shadow-surface-xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">Notifications</p>
                  {unreadCount > 0 && (
                    <Badge variant="primary" size="xs">{unreadCount}</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    All caught up! No new notifications.
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors',
                        !n.is_read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        )}
                        <div className={!n.is_read ? '' : 'ml-3.5'}>
                          <p className="text-xs font-medium text-text">
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-border">
                <button
                  onClick={() => { setIsOpen(false); }}
                  className="w-full px-4 py-2.5 text-xs text-primary hover:text-primary-400 transition-colors text-center"
                >
                  View all notifications →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Topbar Component ─────────────────────────────────────────────────────────

interface TopbarProps {
  title?: string;
}

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { user, activeShop, assignedShops, setActiveShop } = useAuth();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const [shopMenuOpen, setShopMenuOpen] = useState(false);

  return (
    <header className="h-16 flex items-center gap-4 px-5 border-b border-border bg-surface-1 flex-shrink-0 relative z-30">
      {/* Page title (mobile) */}
      {title && (
        <h1 className="font-semibold text-text text-sm sm:hidden">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 flex items-center gap-4">
        <GlobalSearch />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Shop Switcher */}
        {assignedShops.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShopMenuOpen(v => !v)}
              className={cn(
                'hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl text-sm',
                'text-text-muted hover:text-text hover:bg-surface-2 transition-colors',
                'border border-border',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
              )}
            >
              <Store className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[120px] truncate font-medium">
                {activeShop?.name ?? 'All Shops'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            <AnimatePresence>
              {shopMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShopMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-surface-1 border border-border rounded-xl shadow-surface-lg z-50 p-1"
                  >
                    {assignedShops.map(shop => (
                      <button
                        key={shop.id}
                        onClick={() => {
                          setActiveShop(shop);
                          setShopMenuOpen(false);
                        }}
                        className={cn(
                          'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                          'hover:bg-surface-2 transition-colors',
                          activeShop?.id === shop.id
                            ? 'text-primary bg-primary/10'
                            : 'text-text-muted hover:text-text'
                        )}
                      >
                        <Store className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{shop.name}</span>
                        {activeShop?.id === shop.id && (
                          <span className="ml-auto text-[10px] font-medium text-primary">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-xl text-text-muted hover:text-text',
            'hover:bg-surface-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
          )}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        <Avatar
          src={user?.profile.avatar_url}
          name={`${user?.profile.first_name} ${user?.profile.last_name ?? ''}`.trim()}
          size="sm"
          className="ml-1"
        />
      </div>
    </header>
  );
};

export default Topbar;
