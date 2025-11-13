import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Contact, Connector, Notification } from '@/types/user.types';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  contacts: Contact[];
  connectors: Connector[];
  notifications: Notification[];

  // Authentication
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Contacts
  addContact: (contact: Contact) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  deleteContact: (contactId: string) => void;

  // Connectors
  connectService: (connector: Connector) => void;
  disconnectService: (connectorId: string) => void;

  // Notifications
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      contacts: [],
      connectors: [],
      notifications: [],

      login: (user, token) => {
        localStorage.setItem('coconotecc-token', token);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('coconotecc-token');
        set({
          user: null,
          isAuthenticated: false,
          contacts: [],
          connectors: [],
          notifications: [],
        });
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      addContact: (contact) => set((state) => ({
        contacts: [...state.contacts, contact],
      })),

      updateContact: (contactId, updates) => set((state) => ({
        contacts: state.contacts.map((contact) =>
          contact.id === contactId ? { ...contact, ...updates } : contact
        ),
      })),

      deleteContact: (contactId) => set((state) => ({
        contacts: state.contacts.filter((contact) => contact.id !== contactId),
      })),

      connectService: (connector) => set((state) => ({
        connectors: [...state.connectors.filter((c) => c.type !== connector.type), connector],
      })),

      disconnectService: (connectorId) => set((state) => ({
        connectors: state.connectors.map((connector) =>
          connector.id === connectorId
            ? { ...connector, connected: false, accessToken: undefined, refreshToken: undefined }
            : connector
        ),
      })),

      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
      })),

      markNotificationRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        ),
      })),

      clearNotifications: () => set({ notifications: [] }),

      getUnreadCount: () => {
        const { notifications } = get();
        return notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'coconotecc-user',
    }
  )
);
