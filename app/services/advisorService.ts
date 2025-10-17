import api from './api';

interface PaginationParams {
  id: string;
  page: number;
  limit: number;
  search?: string;
}

export interface AdvisorUser {
  id: string;
  name: string;
  phone: string;
  birthDay: string;
  contactName: string;
  contactNumber: string;
  relationship: string;
  advisorName: string;
  advisorNumber: string;
  advisorPayment: boolean;
  updatedBy: string;
}

export interface UpdatePaymentStatusRequest {
  status: boolean;
}

export interface AdvisorUsersResponse {
  data: AdvisorUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
}

const advisorService = {
  /**
   * Fetch paginated list of advisor users
   */
  async getAdvisorUsers(params: PaginationParams): Promise<AdvisorUsersResponse> {
    const queryParams = new URLSearchParams({
      id: params.id.toString(),
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.search && { search: params.search })
    });

    const response = await api.get<AdvisorUsersResponse>(`users/advisor/users?${queryParams.toString()}`);
    
    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to fetch advisor users');
    }

    return response.data;
  },

  /**
   * Get advisor user by ID
   */
  async getAdvisorUserById(id: string): Promise<AdvisorUser> {
    const response = await api.get<AdvisorUser>(`users/advisor/users/${id}`);
    
    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to fetch advisor user');
    }

    return response.data;
  },

  /**
   * Create a new advisor user
   */
  async createAdvisorUser(userData: Omit<AdvisorUser, 'id'>): Promise<AdvisorUser> {
    const response = await api.post<AdvisorUser>('users/advisor/users', userData);
    
    if (response.code !== 200 && response.code !== 201) {
      throw new Error(response.message || 'Failed to create advisor user');
    }

    return response.data;
  },

  /**
   * Update an existing advisor user
   */
  async updateAdvisorUser(id: string, userData: Partial<AdvisorUser>): Promise<AdvisorUser> {
    const response = await api.put<AdvisorUser>(`users/advisor/payment/${id}`, { status: userData.advisorPayment, updatedBy: userData.updatedBy });
    
    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to update advisor user');
    }

    return response.data;
  },

  /**
   * Delete an advisor user
   */
  async deleteAdvisorUser(id: string): Promise<void> {
    const response = await api.delete<void>(`users/advisor/users/${id}`);
    
    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to delete advisor user');
    }
  }
};

export default advisorService;
