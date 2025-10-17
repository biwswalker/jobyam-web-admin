import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertDialog from '../../../components/shared/AlertDialog';
import { useLanguage } from '../../components/DashboardLayout';
import api from '../../services/api';
import { deleteItem } from '../../services/deleteService';
import { DataTable } from '../../components/DataTable';
const API_URL = import.meta.env.VITE_API_URL_MEDIA;

interface JobManpower {
  id: string;
  name: string;
  detail?: string;
  contract?: string;
  contractNumber?: string;
  certificate?: string;
  address?: string;
  location?: string;
  status?: boolean;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export function meta() {
  return [
    { title: "Job Manpower Management - JobYam Admin" },
    { name: "description", content: "Manage Job Manpower entries" },
  ];
}

export default function JobManpowerPage() {
  const { language } = useLanguage();
  const [jobManpowers, setJobManpowers] = useState<JobManpower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJobManpowerId, setSelectedJobManpowerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
const [sortField, setSortField] = useState<string>('name');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
const [page, setPage] = useState<number>(1);

  // Filter, sort, and pagination logic
  const filteredJobManpowers = jobManpowers
    .filter(jm => jm.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof JobManpower];
      let bValue: any = b[sortField as keyof JobManpower];
      if (sortField === 'status') { aValue = aValue ? 1 : 0; bValue = bValue ? 1 : 0; }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredJobManpowers.length / pageSize));
  const paginatedJobManpowers = filteredJobManpowers.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  }


  const fetchJobManpowers = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Check sessionStorage first if not forcing refresh
      const cachedData = sessionStorage.getItem('jobManpowers');
      if (cachedData && !forceRefresh) {
        const data = JSON.parse(cachedData);
        setJobManpowers(data);
        setLoading(false);
        return;
      }

      const result = await api.get<ApiResponse<JobManpower[]>>('jobmanpower');

      if (result.code === 200 && result.status === 'OK' && Array.isArray(result.data)) {
        sessionStorage.setItem('jobManpowers', JSON.stringify(result.data));
        setJobManpowers(result.data);
      } else {
        if (result.data === null) {
          setJobManpowers([]);
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job manpowers');
    } finally {
      setLoading(false);
    }
  };

  // Toggle status handler
  const handleToggleStatus = async (jm: JobManpower) => {
    try {
      // Adjust the endpoint if your backend uses a different one
      const response = await api.put(`status/jobmanpower/${jm.id}`, { status: !jm.status, updatedBy: jm.id });
      
      if (response.code === 200 && response.status === 'OK') {
        fetchJobManpowers(true);
      } else {
        setError('Failed to toggle status');
      }
    } catch (err) {
      setError('Failed to toggle status');
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchJobManpowers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{language === 'en' ? 'ManPower Supply' : 'ผู้จัดหา'}</h1>
            <p className="text-sm text-gray-500 mt-1">{language === 'en' ? 'All ManPower Supply entries in the system' : 'รายการผู้จัดหา ทั้งหมดในระบบ'}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => fetchJobManpowers(true)}
              disabled={loading}
              className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
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
                  <svg className="-ml-1 mr-2 h-4 w-4 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {language === 'en' ? 'Refresh Data' : 'รีเฟรชข้อมูล'}
                </>
              )}
            </button>
            <Link
              to="/jobmanpower/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {language === 'en' ? 'Add ManPower Supply' : 'เพิ่มผู้จัดหา'}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <div className="relative mt-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 pl-10 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'en' ? 'Search...' : 'ค้นหา...'}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Custom Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-xs font-semibold text-gray-700 text-left">#</th>
                <th
                  className="px-4 py-2 text-xs font-semibold text-gray-700 text-left cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  {language === 'en' ? 'Name' : 'ชื่อ'}
                </th>
                <th
                  className="px-4 py-2 text-xs font-semibold text-gray-700 text-left cursor-pointer select-none"
                  onClick={() => handleSort('address')}
                >
                  {language === 'en' ? 'Address' : 'ที่อยู่'}
                </th>
                <th
                  className="px-4 py-2 text-xs font-semibold text-gray-700 text-left cursor-pointer select-none"
                  onClick={() => handleSort('status')}
                >
                  {language === 'en' ? 'Status' : 'สถานะ'}
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-700 text-center">{language === 'en' ? 'Edit' : 'แก้ไข'}</th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-700 text-center">{language === 'en' ? 'Delete' : 'ลบ'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobManpowers.map((jm, index) => (
                <tr key={jm.id}>
                  <td className="px-4 py-2 text-sm text-gray-500">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{jm.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{jm.address || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{jm.status ? (language === 'en' ? 'Active' : 'ใช้งาน') : (language === 'en' ? 'Inactive' : 'ไม่ใช้งาน')}</td>
                  <td className="px-4 py-2 text-sm text-center">
                    <Link to={`/jobmanpower/edit/${jm.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-100">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6-6a2 2 0 112.828 2.828l-6 6m-2 2H7v-2a2 2 0 012-2z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-center">
                    <button
                      onClick={() => {
                        setSelectedJobManpowerId(jm.id || '');
                        setDeleteDialogOpen(true);
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-100"
                      title={language === 'en' ? 'Delete' : 'ลบ'}
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end items-center p-4 border-t">
            <span className="text-sm text-gray-500 mr-4">
              {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredJobManpowers.length)} ${language === 'en' ? 'of' : 'จาก'} ${filteredJobManpowers.length} ${language === 'en' ? 'items' : 'รายการ'}`}
            </span>
            <nav className="inline-flex -space-x-px" aria-label="Pagination">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 border border-gray-300 text-gray-500 bg-white rounded-l hover:bg-gray-50 disabled:opacity-50">&lt;</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 ${pageNumber === page ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 border border-gray-300 text-gray-500 bg-white rounded-r hover:bg-gray-50 disabled:opacity-50">&gt;</button>
            </nav>
          </div>
        </div>

        <AlertDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedJobManpowerId(null);
          }}
          onConfirm={async () => {
            if (selectedJobManpowerId) {
              try {
                const success = await deleteItem('manpower', selectedJobManpowerId);
                if (success) {
                  fetchJobManpowers(true);
                }
              } catch (error) {
                console.error('Failed to delete job manpower:', error);
              } finally {
                setDeleteDialogOpen(false);
                setSelectedJobManpowerId(null);
              }
            }
          }}
          title={language === 'en' ? 'Delete ManPower Supply' : 'ลบผู้จัดหา'}
          message={language === 'en' ? 'Are you sure you want to delete this ManPower Supply?' : 'คุณแน่ใจหรือไม่ที่จะลบผู้จัดหานี้?'}
        />
      </div>
    </div>
  );
}
