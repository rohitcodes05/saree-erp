import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// ─── App Layout ───────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { resolvedTheme } = useThemeStore();

  return (
    <div
      className="flex h-screen overflow-hidden bg-surface"
      data-theme={resolvedTheme}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden p-5 lg:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
