import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../../../../types/notification/notification';
import { notificationService } from '../../../../services/notificationService';
 

interface UseNotificationsReturn {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  total: number;
  unreadCount: number;
  refetch: () => Promise<void>;
}

export const useNotifications = (page: number = 1, limit: number = 20): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotifications(page, limit);

      if (response.success && response.data) {
        const notificationsData = response.data.data?.notifications || [];
        setNotifications(notificationsData);
        setTotal(response.data.data?.total || 0);
        setUnreadCount(response.data.data?.unreadCount || 0);
      } else {
        setError(response.error || 'Failed to load notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const refetch = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    error,
    total,
    unreadCount,
    refetch,
  };
};

