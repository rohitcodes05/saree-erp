import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

// ─── PWA Service Worker Registration ─────────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('workbox-window').then(({ Workbox }) => {
    const wb = new Workbox('/sw.js');
    wb.addEventListener('installed', event => {
      if (event.isUpdate) {
        // Prompt user to refresh for new version
        if (window.confirm('New version available! Refresh to update?')) {
          window.location.reload();
        }
      }
    });
    wb.register();
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found. Check index.html.');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
