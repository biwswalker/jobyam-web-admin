import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import pkg from 'lodash';
const { debounce } = pkg;

// XCircleIcon SVG component
const XCircleIcon = ({ className = 'w-6 h-6' }) => (
  <svg 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);
import api from '../../services/api';
import AlertDialog from '../../../components/shared/AlertDialog';
import { deleteItem } from '../../services/deleteService';
import { useLanguage } from '../../components/DashboardLayout';
import useUserInfo from "~/hooks/useUserInfo";

interface JobType {
  id: string;
  name: string;
  subName: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

interface JobTypesResponse {
  data: JobType[];
  pagination: Pagination;
}

type SortField = 'name' | 'subName' | 'status' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export function meta() {
  return [
    { title: "Job Types - JobYam Admin" },
    { name: "description", content: "Manage Job Types" },
  ];
}

export default function JobTypesPage() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJobTypeId, setSelectedJobTypeId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    order: SortOrder;
  }>({ field: 'name', order: 'asc' });
  const navigate = useNavigate();
  const { userInfo, isLoading: isLoadingUser } = useUserInfo() || {};

  const fetchJobTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.field,
        sortOrder: sortConfig.order,
        ...(searchQuery && { search: searchQuery })
      });

      const result = await api.get<JobTypesResponse>(`jobs/types?${params.toString()}`);

      if (result.data) {
        setJobTypes(result.data.data);
        setPagination(prev => ({
          ...prev,
          ...result.data.pagination,
          page: Number(result.data.pagination.page) || prev.page,
          limit: Number(result.data.pagination.limit) || prev.limit
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job types';
      setError(errorMessage);
      setJobTypes([]);
      console.error('Error fetching job types:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig.field, sortConfig.order, searchQuery]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        setPagination(prev => ({ ...prev, page: 1 }));
      }, 500),
    [setSearchQuery, setPagination]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    debouncedSearch(query);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Toggle job type status
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      await api.put(`status/jobtype/${id}`, { status: !currentStatus, updatedBy: userInfo?.id || '' });
      
      // Update the local state to reflect the change immediately
      setJobTypes(prevJobTypes => 
        prevJobTypes.map(jobType => 
          jobType.id === id 
            ? { ...jobType, status: !currentStatus } 
            : jobType
        )
      );
      
      // Show success message (optional)
      console.log('Status updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      console.error('Error updating status:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and on dependency change
  useEffect(() => {
    fetchJobTypes();
  }, [fetchJobTypes]);

  if (loading && jobTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Error display component
  const ErrorAlert = ({ message }: { message: string }) => (
    <div className="rounded-md bg-red-50 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{message}</h3>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="w-full">
        {/* Error Alert */}
        {error && <ErrorAlert message={error} />}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{language === 'en' ? 'Job Types' : 'ประเภทงาน'}</h1>
              <p className="text-sm text-gray-500 mt-1">{language === 'en' ? 'All job types in the system' : 'รายการประเภทงานทั้งหมดในระบบ'}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchJobTypes()}
                disabled={loading}
                className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] hover:bg-[var(--color-primary-dark,#002D8C)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {language === 'en' ? 'Loading...' : 'กำลังโหลด...'}
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {language === 'en' ? 'Refresh' : 'รีเฟรช'}
                  </>
                )}
              </button>
              <button
                onClick={() => navigate("/jobs/types/create")}
                className="inline-flex items-center cursor-pointer px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] hover:bg-[var(--color-primary-dark,#002D8C)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                {language === 'en' ? 'Add Job Type' : 'เพิ่มประเภทงาน'}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder={language === 'en' ? 'Search job types...' : 'ค้นหาประเภทงาน...'}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
              >
                <option value="10">10 {language === 'en' ? 'items' : 'รายการ'}</option>
                <option value="25">25 {language === 'en' ? 'items' : 'รายการ'}</option>
                <option value="50">50 {language === 'en' ? 'items' : 'รายการ'}</option>
                <option value="100">100 {language === 'en' ? 'items' : 'รายการ'}</option>
              </select>
            </div>
          </div>

        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('name')}
                  aria-sort={sortConfig.field === 'name' ? sortConfig.order === 'asc' ? 'ascending' : 'descending' : 'none'}
                  aria-label={`${language === 'en' ? 'Sort by name' : 'เรียงตามชื่อ'} ${sortConfig.field === 'name' ? sortConfig.order === 'asc' ? '(A-Z)' : '(Z-A)' : ''}`}
                >
                  <div className="flex items-center">
                    {language === 'en' ? 'Name' : 'ชื่อ'}
                    {sortConfig.field === 'name' && (
                      <span className="ml-1">
                        {sortConfig.order === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('subName')}
                >
                  <div className="flex items-center">
                    {language === 'en' ? 'Short Name' : 'ชื่อย่อ'}
                    {sortConfig.field === 'subName' && (
                      <span className="ml-1">
                        {sortConfig.order === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {language === 'en' ? 'Status' : 'สถานะ'}
                </th>
                {/* <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center">
                    {language === 'en' ? 'Last Updated' : 'อัปเดตล่าสุด'}
                    {sortConfig.field === 'updatedAt' && (
                      <span className="ml-1">
                        {sortConfig.order === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th> */}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Actions' : 'การดำเนินการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {language === 'en' ? 'No job types found' : 'ไม่พบประเภทงาน'}
                  </td>
                </tr>
              ) : (
                jobTypes.map((jobType) => (
                  <tr key={jobType.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{jobType.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{jobType.subName}</div>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        type="button"
                        onClick={() => toggleStatus(jobType.id, jobType.status)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${jobType.status ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                        aria-label={`${jobType.status ? (language === 'en' ? 'Deactivate' : 'ปิดการใช้งาน') : (language === 'en' ? 'Activate' : 'เปิดใช้งาน')} ${jobType.name}`}
                      >
                        {jobType.status ? (language === 'en' ? 'Active' : 'เปิดใช้งาน') : (language === 'en' ? 'Inactive' : 'ปิดใช้งาน')}
                      </button>
                    </td> */}
                    <td className="px-4 py-2 text-center">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleStatus(jobType.id, jobType.status)}
                        className={`relative cursor-pointer inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${jobType.status ? 'bg-[var(--color-primary,#0038A8)]' : 'bg-gray-200'}`}
                      >
                        <span className="sr-only">{language === 'en' ? 'Toggle status' : 'สลับสถานะ'}</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${jobType.status ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                      <span className="ml-2 text-sm">
                        {jobType.status ?
                          (language === 'en' ? 'Active' : 'ใช้งาน') :
                          (language === 'en' ? 'Inactive' : 'ไม่ใช้งาน')
                        }
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {jobType.updatedAt ? new Date(jobType.updatedAt).toLocaleString() : '-'}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/jobs/types/edit/${jobType.id}`}
                          className="text-teal-600 cursor-pointer hover:text-teal-900"
                          title={language === 'en' ? 'Edit' : 'แก้ไข'}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedJobTypeId(jobType.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 cursor-pointer hover:text-red-900"
                          title={language === 'en' ? 'Delete' : 'ลบ'}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPage > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {language === 'en' ? 'Previous' : 'ก่อนหน้า'}
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {language === 'en' ? 'Next' : 'ถัดไป'}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {language === 'en' ? 'Showing' : 'แสดง'} <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> {language === 'en' ? 'to' : 'ถึง'} <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> {language === 'en' ? 'of' : 'จาก'} <span className="font-medium">{pagination.total}</span> {language === 'en' ? 'results' : 'รายการ'}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">{language === 'en' ? 'Previous' : 'ก่อนหน้า'}</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPage) }, (_, i) => {
                    // Calculate page numbers to show (current page in the middle if possible)
                    let pageNum;
                    if (pagination.totalPage <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPage - 2) {
                      pageNum = pagination.totalPage - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-teal-50 border-teal-500 text-teal-600 z-10'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">{language === 'en' ? 'Next' : 'ถัดไป'}</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )
      }
      </div>
      <AlertDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedJobTypeId(null);
        }}
        onConfirm={async () => {
          if (!selectedJobTypeId) return;

          try {
            setLoading(true);
            const success = await deleteItem('jobType', selectedJobTypeId);
            if (success) {
              await fetchJobTypes();
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete job type';
            setError(errorMessage);
            console.error('Failed to delete job type:', errorMessage);
          } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setSelectedJobTypeId(null);
          }
        }}
        title={language === 'en' ? 'Delete Job Type' : 'ลบรายการงาน'}
        message={language === 'en' ? 'Are you sure you want to delete this job type?' : 'คุณแน่ใจหรือไม่ที่จะลบประเภทงานนี้?'}
        confirmText={language === 'en' ? 'Delete' : 'ลบ'}
        cancelText={language === 'en' ? 'Cancel' : 'ยกเลิก'}
        isLoading={loading}
      />
    </div>
  );
}
