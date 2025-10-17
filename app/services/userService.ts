import api from "./api";
import type { ApiResponse } from "./api";

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDay?: string;
  companyId?: string | null;
  contactName?: string;
  contactNumber?: string;
  manpowerId?: string | null;
  relationship?: string;
  status?: boolean;
  userName?: string;
  role?: {
    id: string;
    name: string;
  };
}

// Define the response structure from the API
export interface UsersResponse {
  limit: number;
  offset: number;
  total: number;
  users: User[];
}

export const getUsers = (
  type: string = "user",
  limit: number = 10000,
  offset: number = 0,
  sortBy: string = "name",
  sortOrder: string = "asc"
): Promise<ApiResponse<UsersResponse>> => {
  return api.get<UsersResponse>(
    `users/?type=${type}&limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  );
};

export const sendCustomNotification = (
  userId: string,
  title: string,
  message: string
): Promise<ApiResponse<any>> => {
  // Get admin user ID from localStorage
  let createdBy = "system";
  try {
    const adminUserData = localStorage.getItem("jobyamUserAdmin");
    if (adminUserData) {
      const adminUser = JSON.parse(adminUserData);
      createdBy = adminUser.id || "system";
    }
  } catch (error) {
    // If there's an error parsing the JSON, use the default value
    createdBy = "system";
  }

  return api.post<any>("notifications/to/users", {
    userID: userId,
    title,
    message,
    type: "admin",
    createdBy
  });
};
