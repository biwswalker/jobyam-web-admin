import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AdminLog, ApiResponse, PaginationState, LogStatus, LogFilters } from './types';
import api from '~/services/api';

interface UseAdminLogsReturn {
  logs: AdminLog[];
  loading: boolean;
  refetch: (page: number, size: number) => Promise<void>;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  actionTypes: string[];
}

export const useAdminLogs = (
  filters: Partial<LogFilters>,
  initialPage: number, 
  initialPageSize: number
): UseAdminLogsReturn => {
  const { searchTerm = '', status = 'All', actionType = 'All', startDate = '', endDate = '', userId = 'All' } = filters;
  const effectRan = useRef(false);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchLogs = useCallback(async (page: number, size: number) => {
    try {
      setLoading(true);
      
      const params: Record<string, string> = {
        page: page.toString(),
        limit: size.toString(),
      };

      if (searchTerm) params.search = searchTerm;
      if (status !== 'All') params.status = status;
      if (actionType !== 'All') params.actionType = actionType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (userId !== 'All') params.userId = userId;

      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get<ApiResponse<AdminLog>>(`adminlogs?${queryParams}`);
      
      if (response?.data) {
        const responseData = response;
        const logsData = Array.isArray(responseData.data?.data) 
          ? responseData.data.data 
          : [];
        
        setLogs(logsData);
        
        const paginationData = responseData.data.pagination || {
          currentPage: page,
          pageSize: size,
          totalItems: 0,
          totalPages: 1
        };
        
        setPagination({
          currentPage: Number(paginationData.currentPage) || page,
          pageSize: Number(paginationData.pageSize) || size,
          totalItems: Number(paginationData.totalItems) || 0,
          totalPages: Number(paginationData.totalPages) || 1
        });
      }
    } catch (error) {
      console.error('Failed to fetch admin logs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, status, actionType, startDate, endDate, userId]);

  // Fetch logs when filters or pagination changes
  useEffect(() => {
    const fetchData = async () => {
      await fetchLogs(pagination.currentPage, pagination.pageSize);
    };
    
    fetchData();
  }, [fetchLogs, pagination.currentPage, pagination.pageSize, searchTerm, status, actionType, startDate, endDate, userId]);
  
  // Reset to first page when filters change (except pagination)
  useEffect(() => {
    if (pagination.currentPage !== 1) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm, status, actionType, startDate, endDate, userId]);

  // Function to manually refetch with current state or provided page/size
  const refetch = useCallback(async (page: number = pagination.currentPage, size: number = pagination.pageSize) => {
    await fetchLogs(page, size);
  }, [fetchLogs, pagination.currentPage, pagination.pageSize]);

  // Get unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(log => types.add(log.actionType));
    return Array.from(types);
  }, [logs]);

  return { 
    logs, 
    loading, 
    refetch,
    pagination, 
    setPagination,
    actionTypes
  };
};
