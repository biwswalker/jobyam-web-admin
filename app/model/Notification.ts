export interface Notification {
  id: string;
  type: 'job' | 'system';  
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCounts {
  totalJobCount: number;
  totalSystemCount: number;
  unreadJobCount: number;
  unreadSystemCount: number;
}

export interface NotificationData {
  notiJob: Notification[];
  notiSystem: Notification[];
}

export interface NotificationResponse {
  code: number;
  status: string;
  data: NotificationData & NotificationCounts;
}
