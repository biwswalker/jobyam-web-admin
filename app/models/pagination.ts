import type { Applicant } from '../services/applicants';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  limit: number;
  page: number;
  total: number;
}

export interface GetApplicantsParams {
  role: string;
  userId: string;
  checkStatus?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  sortField?: string;
}

export type PaginatedApplicantResponse = PaginatedResponse<Applicant>;
