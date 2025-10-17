import api from "./api";
import type { ApiResponse } from "./api";

export interface Document {
  id: number;
  seq: number;
  name: string;
  description: string;
  sampleDoc: string;
  formTemplates: string;
  fileDownload: string;
  templateName: string;
}

export interface DocumentsResponse {
  data: Document[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Fetches a single template plan by ID
 */
export const getDocumentById = async (
  id: string
): Promise<ApiResponse<Document>> => {
  try {
    const response = await api.get<Document>(`master/document/${id}`);
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    // If the response is already in the expected format, return it with ApiResponse
    if (response.data && typeof response.data === 'object') {
      return {
        code: 200,
        status: 'OK',
        message: 'Document retrieved successfully',
        data: response.data as Document
      };
    }
    
    // If the response is just the data directly, wrap it in the ApiResponse format
    if (response && typeof response === 'object') {
      return {
        code: 200,
        status: 'OK',
        message: 'Document retrieved successfully',
        data: response as unknown as Document
      };
    }
    
    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error in getDocumentById:', error);
    throw error;
  }
};

/**
 * Fetches template plans with pagination and optional search
 */
// The actual API response structure
export interface DocumentsApiResponse {
  data: Document[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export const getDocuments = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<DocumentsApiResponse> => {
  try {
    const response = await api.get<DocumentsApiResponse>(
      `master/document?page=${page}&limit=${pageSize}${
        search ? `&search=${encodeURIComponent(search)}` : ''
      }`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new template plan
 */
export const createDocument = async (
  formData: FormData
): Promise<ApiResponse<Document>> => {
  try {
    const response = await api.post<Document>(
      'master/document', 
      formData,
      {
        headers: {}
      }
    );
    
    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to create document');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(`Request setup failed: ${error.message}`);
    }
  }
};

/**
 * Updates an existing document
 */
export const updateDocument = async (
  id: string,
  formData: FormData
): Promise<ApiResponse<Document>> => {
  try {
    const response = await api.put<ApiResponse<Document>>(
      `master/document/${id}`,
      formData,
      {
        headers: {}
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to update document');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(`Request setup failed: ${error.message}`);
    }
  }
};

/**
 * Deletes a template plan
 */
export const deleteDocument = async (
  id: string
): Promise<number> => {
  try {
    const response = await api.delete(`master/document/${id}`);
    return response.code;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
