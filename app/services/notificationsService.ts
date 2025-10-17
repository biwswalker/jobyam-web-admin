import api from './api';
import type { ApiResponse } from './api';

export interface Notification {
  id: string;
  job_title: string;
  user_name: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
  map_user_jobs: string;
  // Add other fields as needed
}

export const getAdminNotifications = (query: string): Promise<ApiResponse<Notification[]>> => {
  return api.get<Notification[]>(`notifications/admin?${query}`);
};

export const markNotificationAsRead = (id: string): Promise<ApiResponse<any>> => {
  return api.put<any>(`notifications/${id}/read`, {});
};
