import api from './api';
import type { ApiResponse } from './api';

export type DeleteType = 'job' | 'company' | 'jobType' | 'manpower' | 'admin';

const DELETE_ENDPOINTS = {
  job: (id: string) => `jobs/${id}`,
  company: (id: string) => `jobs/company/${id}`,
  jobType: (id: string) => `jobs/types/${id}`,
  manpower: (id: string) => `jobmanpower/${id}`,
  admin: (id: string) => `admin/status/${id}`,
};

export const deleteItem = async (type: DeleteType, id: string): Promise<boolean> => {
  try {
    const endpoint = DELETE_ENDPOINTS[type](id);
    const response: ApiResponse<any> = await api.delete(endpoint);
    return Number(response.code) >= 200 && Number(response.code) < 300;
  } catch (error) {
    console.error(`Failed to delete ${type}:`, error);
    throw error;
  }
};
