// Dashboard API Service
import api from './api';
import type { ApiResponse } from './api';
import type { DashboardData } from '../dashboard/index';

export const fetchDashboard = (role: string, user_id: string): Promise<ApiResponse<DashboardData>> => {
  return api.get<DashboardData>(`dashboard?role=${encodeURIComponent(role)}&user_id=${encodeURIComponent(user_id)}`);
};