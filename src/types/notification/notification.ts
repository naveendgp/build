// Notification API Response Types

export interface Notification {
  _id: string;
  user_id: string;
  title: string;
  metadata: {
    timestamp: string
  }
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
  updatedAt: string;
  __v?: number;
}

export interface NotificationsResponse {
  status: boolean;
  data: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}






