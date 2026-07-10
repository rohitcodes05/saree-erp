import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

// ─── State Interface ──────────────────────────────────────────────────────────

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  fetchNotifications: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      setNotifications: (notifications) =>
        set(
          {
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length,
          },
          false,
          'notifications/set'
        ),

      addNotification: (notification) => {
        const notifications = [notification, ...get().notifications];
        set(
          {
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length,
          },
          false,
          'notifications/add'
        );
      },

      markAsRead: async (id: string) => {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id);

        set(
          (state) => {
            const notifications = state.notifications.map(n =>
              n.id === id ? { ...n, is_read: true } : n
            );
            return {
              notifications,
              unreadCount: notifications.filter(n => !n.is_read).length,
            };
          },
          false,
          'notifications/markRead'
        );
      },

      markAllAsRead: async () => {
        const ids = get()
          .notifications
          .filter(n => !n.is_read)
          .map(n => n.id);

        if (ids.length === 0) return;

        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', ids);

        set(
          (state) => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0,
          }),
          false,
          'notifications/markAllRead'
        );
      },

      removeNotification: (id: string) =>
        set(
          (state) => {
            const notifications = state.notifications.filter(n => n.id !== id);
            return {
              notifications,
              unreadCount: notifications.filter(n => !n.is_read).length,
            };
          },
          false,
          'notifications/remove'
        ),

      fetchNotifications: async () => {
        set({ isLoading: true }, false, 'notifications/fetchStart');

        const { data } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        set(
          {
            notifications: data ?? [],
            unreadCount: (data ?? []).filter(n => !n.is_read).length,
            isLoading: false,
          },
          false,
          'notifications/fetchDone'
        );
      },
    }),
    { name: 'NotificationStore' }
  )
);
