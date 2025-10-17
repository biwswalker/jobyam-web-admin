import React, { useState, useEffect, useRef } from 'react';
import { t } from '../locales';
import { useNavigate } from 'react-router-dom';
import { getApplicants, getApplicantsByRole, formatDate } from '../services/applicants';
import type { Applicant } from '../services/applicants';
import type { PaginationState } from '../models/pagination';
import { useLanguage } from '~/components/DashboardLayout';
import Tooltip from '../components/Tooltip';


export default function ApplicantsIndex() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0
  });
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>({
    field: 'sequence',
    direction: 'asc'
  });
  const { language } = useLanguage();

  // Fetch applicants data
  // Handle header click for sorting
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    
    // Reset to first page when changing sort
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Refetch with new sort
    fetchApplicants(1, pagination.limit, searchTerm, field, 
      sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc');
  };
  
  // Get sort indicator for table headers
  const getSortIndicator = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const fetchApplicants = async (
    page = 1, 
    limit = 20, 
    search = searchTerm, 
    sortField = sortConfig.field, 
    sortOrder = sortConfig.direction
  ) => {
    try {
      setLoading(true);

      // Get user_id and role from localStorage
      const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
      const userId = user.id || '';
      const role = user.role.name || '';

      // Fetch with pagination, search, and sorting parameters
      const response = await getApplicantsByRole({
        role,
        userId,
        checkStatus: false,
        page,
        limit,
        sortOrder,
        sortField,
        search: search || ''
      });

      // Update pagination state
      setPagination(prev => ({
        ...prev,
        page,
        limit,
        total: response.data?.total || 0
      }));

      // Set applicants data
      const applicantsData = response.data?.data || [];
      setApplicants(applicantsData);
      setFilteredApplicants(applicantsData);

      sessionStorage.setItem('applicants', JSON.stringify(applicantsData));
    } catch (err) {
      setError('Unable to load applicant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchApplicants();
  }, []);

  // Handle search term changes with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== '') {
        fetchApplicants(1, pagination.limit, searchTerm, sortConfig.field, sortConfig.direction);
      } 
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, sortConfig.field, sortConfig.direction]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage !== pagination.page && !loading) {
      fetchApplicants(
        newPage, 
        pagination.limit, 
        searchTerm, 
        sortConfig.field, 
        sortConfig.direction
      ).catch(error => {
        console.error('Error changing page:', error);
        setError('Failed to load page. Please try again.');
      });
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPagination(prev => ({
      ...prev,
      limit: newSize,
      page: 1 // Reset to first page when changing page size
    }));
    fetchApplicants(1, newSize, searchTerm, sortConfig.field, sortConfig.direction);
  };

  // Navigate to applicant detail page
  const handleViewDetails = (applicantId: string) => {
    navigate(`/applicants/${applicantId}`);
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('list_of_interested_candidates', language)}</h1>
          {/* <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('no_applicants', language)}</p> */}
        </div>
        <button
          onClick={() => fetchApplicants(1, pagination.limit)}
          disabled={loading}
          className="inline-flex cursor-pointer items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('loading', language)}
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('refresh', language)}
            </>
          )}
        </button>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <label htmlFor="search" className="sr-only">{t('search', language)}</label>
            <input
              type="text"
              id="search"
              className="pl-10 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full text-sm border-gray-300 rounded-lg py-3 bg-white transition duration-150 ease-in-out"
              placeholder={t('search_name_phone', language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicants table/cards */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mb-2"></div>
            <p>{t('loading', language)}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{t('unable_to_load_applicant_data', language)}</p>
            <button
              className="mt-4 px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700"
              onClick={() => window.location.reload()}
            >
              {t('retry', language)}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      {t('applicant', language)}
                      <span className="ml-1">{getSortIndicator('name')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider"
                    onClick={() => handleSort('age')}
                  >
                    <div className="flex items-center">
                      {t('personal_information', language)}
                      <span className="ml-1">{getSortIndicator('age')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center">
                      {t('company', language)}
                      <span className="ml-1">{getSortIndicator('company')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider"
                    onClick={() => handleSort('manpower')}
                  >
                    <div className="flex items-center">
                      {t('manpower', language)}
                      <span className="ml-1">{getSortIndicator('manpower')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider"
                    onClick={() => handleSort('sequence')}
                  >
                    <div className="flex items-center">
                      {t('lastStatus', language)}
                      <span className="ml-1">{getSortIndicator('sequence')}</span>
                    </div>
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider">
                    {t('status', language)}
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 cursor-pointer text-left font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions', language)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {t('no_applicants', language)}
                    </td>
                  </tr>
                ) : (
                  applicants.map((applicant, index) => (
                    <tr key={`${applicant.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                            {applicant.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                            <div className="text-sm text-gray-500">{applicant.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="text-sm font-medium">{applicant.age} ปี</div>
                          <div className="text-sm text-gray-500">{formatDate(applicant.birthDay)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {applicant.company ? (
                          <div className="text-sm text-gray-900">
                            {applicant.company}
                          </div>
                        ) : (
                          <Tooltip content={applicant.assigned === 'topit' ? 'อยู่ระหว่างดำเนินการ' : 'ยังไม่เลือกงาน'}>
                            <div className="text-sm text-gray-900">-</div>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {applicant.manpower ? (
                          <div className="text-sm text-gray-900">
                            {applicant.manpower}
                          </div>
                        ) : (
                          <Tooltip content={applicant.assigned === 'topit' ? 'อยู่ระหว่างดำเนินการ' : 'ยังไม่เลือกงาน'}>
                            <div className="text-sm text-gray-900">-</div>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {applicant.sequence === 0 ? '-' : `${applicant.sequence}.`} {applicant.planName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${applicant.status ? 'text-green-600' : 'text-red-500'}`}
                        >
                          {language === 'en'
                            ? applicant.status
                              ? 'Selected'
                              : 'Not selected'
                            : applicant.status
                              ? 'เลือกงานแล้ว'
                              : 'ยังไม่เลือกงาน'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 cursor-pointer hover:text-blue-900"
                            onClick={() => handleViewDetails(applicant.id)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && filteredApplicants.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              {t('previous', language)}
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page * pagination.limit >= pagination.total
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              {t('next', language)}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('showing', language)}{' '}
                <span className="font-medium">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                {t('to', language)}{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                {t('of', language)} <span className="font-medium">{pagination.total}</span>{' '}
                {t('results', language)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{t('rowsPerPage', language)}:</span>
              <select
                value={pagination.limit}
                onChange={handlePageSizeChange}
                className="block w-24 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">{t('previous', language)}</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex items-center px-2">
                  <span className="text-sm text-gray-700">
                    {t('page', language)} {pagination.page} {t('of', language)} {Math.ceil(pagination.total / pagination.limit) || 1}
                  </span>
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.page * pagination.limit >= pagination.total
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">{t('next', language)}</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
