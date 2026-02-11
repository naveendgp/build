import { useMemo } from 'react';
import { Notification } from '../../../../types/notification/notification';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
};

type NotificationSection = {
  id: string;
  label: string;
  items: NotificationItem[];
};

// Helper function to check if two dates are on the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper function to get date without time for comparison
const getDateOnly = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// Format date to relative time for today, or time format for older dates
const formatDate = (notification: Notification): string => {
  const dateString = notification.created_at || notification.metadata?.timestamp;
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const today = getDateOnly(now);
  const notificationDateOnly = getDateOnly(date);

  // Check if notification is from today
  const isToday = isSameDay(notificationDateOnly, today);

  if (isToday) {
    // For today's notifications, show relative time
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      return `${diffInHours}h ago`;
    }
  } else {
    // For notifications not from today, show time in "8.30 PM" format
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}.${minutesStr} ${ampm}`;
  }
};

export const useNotificationDateHandling = (notifications: Notification[]) => {
  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};
    const now = new Date();
    const today = getDateOnly(now);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.created_at || notification.metadata?.timestamp);
      const notificationDateOnly = getDateOnly(notificationDate);

      let groupKey: string;
      if (isSameDay(notificationDateOnly, today)) {
        groupKey = "Today";
      } else if (isSameDay(notificationDateOnly, yesterday)) {
        groupKey = "Yesterday";
      } else {
        const day = notificationDate.getDate();
        const month = notificationDate.toLocaleString('default', { month: 'short' });
        const year = notificationDate.getFullYear();
        groupKey = `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }, [notifications]);

  // Convert to sections format
  const sections: NotificationSection[] = useMemo(() => {
    return Object.keys(groupedNotifications).map((label, index) => ({
      id: `section-${index}`,
      label,
      items: groupedNotifications[label].map((notification) => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        time: formatDate(notification),
        isRead: notification.is_read,
      })),
    }));
  }, [groupedNotifications]);

  return { sections, groupedNotifications };
};

export type { NotificationItem, NotificationSection };

