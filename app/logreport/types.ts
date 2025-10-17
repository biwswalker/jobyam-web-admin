export type Language = 'en' | 'th';

export type LogStatus = 'Success' | 'Failed' | 'All';

export interface AdminLog {
  id: string;
  userName: string;
  actionType: string;
  actionDetail: string | Record<string, unknown>;
  ipAddress: string;
  device: string;
  status: LogStatus;
  createdAt: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponseData<T> {
  data: T[];
  pagination: PaginationState;
}

export interface ApiResponse<T = any> {
  pagination: any;
  code: number;
  status: string;
  data: ApiResponseData<T>;
}

export interface User {
  id: string;
  name: string;
  role: string;
  agentKey: string;
}

export interface LogFilters {
  searchTerm?: string;
  status?: LogStatus;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}
