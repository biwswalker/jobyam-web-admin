import api from './api';

interface StatusUpdateRequest {
  status: boolean;
  updatedBy: string;
}

interface StatusResponse {
  code: number;
  status: string;
  data: any;
}

export const statusService = {
  // Jobs status update
  updateJobStatus: async (jobId: string, data: StatusUpdateRequest) => {
    return api.put<StatusResponse>(`jobs/update/status/${jobId}`, data);
  },

  // Company status update
  updateCompanyStatus: async (companyId: string, data: StatusUpdateRequest) => {
    return api.put<StatusResponse>(`jobs/company/status/${companyId}`, data);
  },

  // Job type status update
  updateJobTypeStatus: async (jobTypeId: string, data: StatusUpdateRequest) => {
    return api.put<StatusResponse>(`master/jobtype/status/${jobTypeId}`, data);
  },

  // Manpower status update
  updateManpowerStatus: async (manpowerId: string, data: StatusUpdateRequest) => {
    return api.put<StatusResponse>(`master/manpower/status/${manpowerId}`, data);
  }
};

export default statusService;
