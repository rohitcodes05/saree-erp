import React, { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Context ──────────────────────────────────────────────────────────────────

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: 'underline' | 'pill' | 'bordered';
}

const TabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
  variant: 'underline',
});

// ─── Tabs Root ────────────────────────────────────────────────────────────────

export interface TabsProps {
  defaultTab: string;
  value?: string;
  onChange?: (tab: string) => void;
  variant?: 'underline' | 'pill' | 'bordered';
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultTab,
  value,
  onChange,
  variant = 'underline',
  children,
  className,
}) => {
  const [internal, setInternal] = useState(defaultTab);
  const activeTab = value ?? internal;

  const setActiveTab = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

// ─── Tab List ─────────────────────────────────────────────────────────────────

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ children, className }) => {
  const { variant } = useContext(TabsContext);

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center',
        variant === 'underline' && 'border-b border-border gap-1',
        variant === 'pill' && 'gap-1 p-1 bg-surface-2 rounded-xl w-fit',
        variant === 'bordered' && 'gap-1 border border-border rounded-xl p-1',
        className
      )}
    >
      {children}
    </div>
  );
};

// ─── Tab Trigger ──────────────────────────────────────────────────────────────

export interface TabTriggerProps {
  id: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  className?: string;
}

export const TabTrigger: React.FC<TabTriggerProps> = ({
  id,
  children,
  icon,
  badge,
  disabled = false,
  className,
}) => {
  const { activeTab, setActiveTab, variant } = useContext(TabsContext);
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      type="button"
      disabled={disabled}
      aria-selected={isActive}
      onClick={() => !disabled && setActiveTab(id)}
      className={cn(
        'relative flex items-center gap-1.5 text-sm font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Underline variant
        variant === 'underline' && [
          'px-3 py-2.5 rounded-t-lg -mb-px border-b-2',
          isActive
            ? 'text-primary border-primary'
            : 'text-text-muted border-transparent hover:text-text hover:border-border-muted',
        ],
        // Pill variant
        variant === 'pill' && [
          'px-3 py-1.5 rounded-lg',
          isActive
            ? 'bg-surface-1 text-text shadow-surface'
            : 'text-text-muted hover:text-text',
        ],
        // Bordered variant
        variant === 'bordered' && [
          'px-3 py-1.5 rounded-lg',
          isActive
            ? 'bg-primary/15 text-primary-300'
            : 'text-text-muted hover:text-text hover:bg-surface-3',
        ],
        className
      )}
    >
      {icon && (
        <span className={cn('flex-shrink-0', isActive ? 'text-primary' : 'text-text-muted')}>
          {icon}
        </span>
      )}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1',
          'text-[10px] font-bold',
          isActive ? 'bg-primary/20 text-primary' : 'bg-surface-3 text-text-muted'
        )}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

// ─── Tab Panel ────────────────────────────────────────────────────────────────

export interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  keepMounted?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  id,
  children,
  className,
  keepMounted = false,
}) => {
  const { activeTab } = useContext(TabsContext);
  const isActive = activeTab === id;

  if (!keepMounted && !isActive) return null;

  return (
    <motion.div
      role="tabpanel"
      hidden={!isActive}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(isActive ? 'block' : 'hidden', className)}
    >
      {children}
    </motion.div>
  );
};
