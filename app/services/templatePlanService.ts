import api from "./api";
import type { ApiResponse } from "./api";

export interface TemplatePlan {
  id: string;
  name: string;
  description?: string;
  // Add other fields as needed based on your API response
  [key: string]: any;
}

export interface TemplatePlansResponse {
  data: TemplatePlan[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Fetches a single template plan by ID
 */
export const getTemplatePlanById = async (
  id: string
): Promise<ApiResponse<TemplatePlan>> => {
  return api.get(`master/template/plans/${id}`);
};

/**
 * Fetches template plans with pagination and optional search
 */
export const getTemplatePlans = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<ApiResponse<TemplatePlansResponse>> => {
  let url = `master/template/plans?page=${page}&pageSize=${pageSize}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return api.get(url);
};

/**
 * Creates a new template plan
 */
export const createTemplatePlan = async (
  data: Omit<TemplatePlan, 'id'>
): Promise<ApiResponse<TemplatePlan>> => {
  return api.post('master/template/plans', data);
};

/**
 * Updates an existing template plan
 */
export const updateTemplatePlan = async (
  id: string,
  data: Partial<TemplatePlan>
): Promise<ApiResponse<TemplatePlan>> => {
  return api.put(`master/template/plans/${id}`, data);
};

/**
 * Updates a template plan's status
 */
export const updateTemplatePlanStatus = async (
  id: string,
  status: boolean
): Promise<ApiResponse<TemplatePlan>> => {
  return api.put(`status/templatemaster/${id}`, { status });
};

/**
 * Deletes a template plan
 */
export const deleteTemplatePlan = async (
  id: string
): Promise<ApiResponse<void>> => {
  return api.delete(`master/template/plans/${id}`);
};
