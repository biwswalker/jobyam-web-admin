import api from './api';
import type { ApiResponse } from './api';
import type { 
  PaginatedResponse, 
  GetApplicantsParams, 
  PaginationState 
} from '../models/pagination';
import type { AgentStaffOption } from '../models/agent-staff';
import type { N } from 'node_modules/react-router/dist/development/route-data-C6QaL0wu.mjs';

// Type definition for applicant data
export interface Applicant {
  [x: string]: any;
  id: string;
  mapUserJobId: string;
  phone: string;
  name: string;
  company: string;
  manpower: string;
  contactName: string;
  contactNumber: string;
  relationship?: string;
  birthDay: string;
  age: number;
  assigned?: string;
  status: boolean;
  sequence: number;
  planName: string;
  planDate: string;
}

export interface ApplicantActivity {
  id: string;
  phone: string;
  name: string;
  contactName: string;
  contactNumber: string;
  birthDay: string;
  age: number;
  status: boolean;
  jobId: string;
  title: string;
  titleMedia: string;
  company: string;
  manpower: string;
}

// Type definition for job data
export interface JobApplication {
  mapUserJobId: string;
  jobId: string;
  job: string;
  titleMedia: string;
  company: string;
  jobTypeName: string;
  subName: string;
  createdAt: string;
  status: boolean;
  jobScore: number;
  jobSalary: string;
  jobDate: string;
  jobTime: string;
  updatedAt?: string;
}



/**
 * Fetch applicants by role and userId with optional search, pagination, and sorting
 */
export const getApplicantsByRole = (options: GetApplicantsParams): Promise<ApiResponse<PaginatedResponse<Applicant>>> => {
  const { 
    role,
    userId,
    checkStatus = false,
    search = '',
    page = 1,
    limit = 20,
    sortOrder = 'asc',
    sortField = 'sequence'
  } = options;
  const params = new URLSearchParams({
    role: encodeURIComponent(role),
    user_id: encodeURIComponent(userId),
    checkStatus: checkStatus.toString(),
    page: page.toString(),
    limit: limit.toString(),
    sortOrder,
    sortField
  });
  
  if (search) {
    params.append('search', search);
  }
  
  return api.get<PaginatedResponse<Applicant>>(`mapuserjob?${params.toString()}`);
};

/**
 * Fetch applicants activity by role and userId
 */
export const getApplicantsActivityByRole = (role: string, userId: string, flag: string): Promise<ApiResponse<ApplicantActivity[]>> => {
  return api.get<ApplicantActivity[]>(`mapuserjob/activity?role=${encodeURIComponent(role)}&user_id=${encodeURIComponent(userId)}&flag=${encodeURIComponent(flag)}`);
};

/**
 * Fetch all applicants
 */
export const getApplicants = (): Promise<ApiResponse<Applicant[]>> => {
  return api.get<Applicant[]>('mapuserjob/list');
};

/**
 * Get applicant details by ID
 */
export const getApplicantById = (id: string): Promise<ApiResponse<Applicant>> => {
  return api.get<Applicant>(`mapuserjob/list/${id}`);
};

/**
 * Get job applications for an applicant
 */
export const getApplicantJobs = (id: string): Promise<ApiResponse<JobApplication[]>> => {
  return api.get<JobApplication[]>(`mapuserjob/list/${id}`);
};

/**
 * Get latest selected job for an applicant
 */
export const getLatestSelectedJob = (id: string): Promise<ApiResponse<JobApplication>> => {
  return api.get<JobApplication>(`mapuserjob/latest/${id}`);
};

/**
 * Select a job
 */
export const getPlanmasterById = (mapUserJobId: string): Promise<ApiResponse<any>> => {
  return api.get(`planmaster?userID=${mapUserJobId}`);
};

/**
 * Get users select
 */
export const getUsersSelect = (): Promise<ApiResponse<any>> => {
  return api.get('users/select');
};

export const selectPlanmaster = (mapUserJobId: string): Promise<ApiResponse<any>> => {
  // Get admin user ID from localStorage
  let adminUserId = null;
  const adminUserData = localStorage.getItem('jobyamUserAdmin');

  if (adminUserData) {
    const adminUser = JSON.parse(adminUserData);
    adminUserId = adminUser.id;
  }

  return api.post('planmaster', {
    id: mapUserJobId,
    assigned: adminUserId
  });
};

export const cancelPlanmaster = (mapUserJobId: string): Promise<ApiResponse<any>> => {
  // Get admin user ID from localStorage
  let adminUserId = null;
  const adminUserData = localStorage.getItem('jobyamUserAdmin');

  if (adminUserData) {
    const adminUser = JSON.parse(adminUserData);
    adminUserId = adminUser.id;
  }

  return api.put('planmaster/cancel', {
    id: mapUserJobId,
    adminId: adminUserId
  });
};

/**
 * Fetches the list of agent and staff options
 * @returns Promise with agent and staff options
 */
export const getAgentStaffOptions = (): Promise<ApiResponse<AgentStaffOption[]>> => {
  return api.get<AgentStaffOption[]>('users/agent-staff/select');
};

export interface UpdateAssignedAdminParams {
  id: string;
  assigned: string;
  agentKey?: string;
}

export const updateAssignedAdmin = ({
  id,
  assigned,
  agentKey
}: UpdateAssignedAdminParams): Promise<ApiResponse<{ success: boolean }>> => {
  return api.put('mapuserjob/assigned', {
    id,
    assigned,
    agentKey
  });
};

/**
 * Format date string to Thai format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    // Format options for Thai locale
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
      // hour: '2-digit',
      // minute: '2-digit'
    };

    // Add 543 years to convert to Buddhist Era (BE)
    const thaiYear = date.getFullYear() + 543;

    // Format the date using Thai locale
    const formatter = new Intl.DateTimeFormat('th-TH', options);
    const parts = formatter.formatToParts(date);

    // Replace the year part with Thai year
    const formattedDate = parts
      .map(part => {
        if (part.type === 'year') {
          return thaiYear.toString();
        }
        return part.value;
      })
      .join('');

    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};
