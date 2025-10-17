import { useState, useEffect } from 'react';
import type { ReportData, ReportResponse, ApiReportData } from '../types';
import api from '~/services/api';

export const useReportData = (
  reportType: string,
  currentPage: number,
  pageSize: number,
  searchTerm: string
) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [endpointSet, setEndpointSet] = useState<string>('');

  useEffect(() => {
    const fetchReportData = async () => {
      if (!reportType) return;

      try {
        setLoading(true);
        setError(null);

        let endpoint = '';

        switch (reportType) {
          case 'interestedusers':
            endpoint = 'sumaryreport/interestedusers';
            break;
          case 'jobapplicants':
            endpoint = 'sumaryreport/jobapplicants';
            break;
          case 'reportreferralapplicants':
            endpoint = 'sumaryreport/referralapplicants';
            break;
          default:
            return;
        }

        console.log(endpoint, endpointSet);
        if (endpoint == '') {
          setEndpointSet(endpoint);
        } else if (endpointSet != endpoint) {
          currentPage = 1;
          pageSize = 10;
          setEndpointSet(endpoint);
        }

        // Get user_id and role from localStorage
        const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
        const role = user.role.name || '';

        console.log(user);
        let jobManpowerId = '';
        let companyId = '';
        if (role.toLowerCase() === 'manpower') {
          jobManpowerId = user.manpowerID;
        }

        if (role.toLowerCase() === 'owner') {
          companyId = user.companyID;
        }

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          jobManpowerId: jobManpowerId,
          companyId: companyId,
          sortBy: '',
          SortOrder: '',
          search: searchTerm || ''
        }).toString();


        const response = await api.get<ReportResponse>(`${endpoint}?${queryParams}`);

        if (response.data?.data) {
          const apiData = response.data;
          const items = Array.isArray(apiData.data) ? apiData.data : [];

          const paginationData = apiData.pagination;

          const pagination = paginationData || {
            current_page: 1,
            total_pages: 1,
            total_items: items.length,
            limit: pageSize
          };

          setReportData({
            data: items,
            current_page: pagination.current_page,
            total_pages: pagination.total_pages,
            total_items: pagination.total_items,
            limit: pagination.limit
          });
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch report data'));
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportType, currentPage, pageSize, searchTerm]);

  const exportToExcel = async () => {
    if (!reportType) return;

    try {
      let endpoint = '';

      // Determine the base endpoint
      switch (reportType) {
        case 'interestedusers':
          endpoint = 'sumaryreport/export/interestedusers';
          break;
        case 'jobapplicants':
          endpoint = 'sumaryreport/export/jobapplicants';
          break;
        case 'reportreferralapplicants':
          endpoint = 'sumaryreport/export/referralapplicants';
          break;
        default:
          return;
      }

      // Get user_id and role from localStorage
      const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
      const role = user.role.name || '';

      console.log(user);
      let jobManpowerId = '';
      let companyId = '';
      if (role.toLowerCase() === 'manpower') {
        jobManpowerId = user.manpowerID;
      }

      if (role.toLowerCase() === 'owner') {
        companyId = user.companyID;
      }

      const queryParams = new URLSearchParams({
        jobManpowerId: jobManpowerId,
        companyId: companyId,
        sortBy: '',
        SortOrder: '',
        search: searchTerm || ''
      }).toString();

      // Get the token from localStorage
      const token = localStorage.getItem('token');

      // Create the full URL
      const url = `${import.meta.env.VITE_API_URL}${endpoint}?${queryParams}`;

      // Use fetch API to get the file
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export file');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);

      return true;
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      throw err;
    }
  };

  return { reportData, loading, error, exportToExcel };
};
