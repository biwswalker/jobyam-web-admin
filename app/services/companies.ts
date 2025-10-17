import api from './api';
import type { ApiResponse } from './api';

export interface Company {
  id: string;
  name: string;
  address: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Type for API response
interface CompanyApiResponse extends Omit<Company, 'status'> {
  status: boolean;
}

// Type for update data
export interface UpdateCompany {
  name?: string;
  address?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

// Utility functions for status conversion
const convertBooleanToStatus = (status: boolean): 'active' | 'inactive' => {
  return status ? 'active' : 'inactive';
};

const convertStatusToBoolean = (status: 'active' | 'inactive'): boolean => {
  return status === 'active';
};

// Update company type for API requests
export interface UpdateCompany {
  name?: string;
  address?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export const getCompanyById = async (companyId: string): Promise<ApiResponse<Company>> => {
  try {
    const response = await api.get<CompanyApiResponse>(`jobs/companyById/${companyId}`);
    const company: Company = {
      ...response.data,
      status: convertBooleanToStatus(response.data.status)
    };
    return {
      code: parseInt(response.status),
      status: 'OK',
      message: 'Company retrieved successfully',
      data: company
    };
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

export const updateCompany = async (companyId: string, data: UpdateCompany): Promise<ApiResponse<Company>> => {
  try {
    const updateData: Partial<CompanyApiResponse> = {
      ...data,
      status: data.status !== undefined ? convertStatusToBoolean(data.status) : undefined
    };
    
    const response = await api.put<CompanyApiResponse>(`jobs/company/${companyId}`, updateData);
    const company: Company = {
      ...response.data,
      status: convertBooleanToStatus(response.data.status)
    };
    return {
      code: parseInt(response.status),
      status: 'OK',
      message: 'Company updated successfully',
      data: company
    };
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};
