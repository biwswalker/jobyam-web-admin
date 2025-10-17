import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AlertDialog from '../../../components/shared/AlertDialog';
import { deleteItem } from '../../services/deleteService';
import { useLanguage } from '../../components/DashboardLayout';

interface Company {
  id: string;
  name: string;
  address: string;
  email: string;
  status: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export function meta() {
  return [
    { title: "Companies - JobYam Admin" },
    { name: "description", content: "Manage Companies" },
  ];
}

export default function CompanyPage() {
  const { language } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // --- SORT & SEARCH & PAGINATION ---
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter and sort companies
  const filteredCompanies = companies.filter(company => {
    const q = search.toLowerCase();
    return (
      company.name.toLowerCase().includes(q) ||
      (company.email || '').toLowerCase().includes(q) ||
      (company.address || '').toLowerCase().includes(q) ||
      (company.status ? (language === 'en' ? 'Inactive' : 'ปิดใช้งาน') : (language === 'en' ? 'Active' : 'เปิดใช้งาน')).toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    let aValue: any = a[sortField as keyof Company];
    let bValue: any = b[sortField as keyof Company];
    // Special case for status (boolean)
    if (sortField === 'status') {
      aValue = aValue ? 1 : 0;
      bValue = bValue ? 1 : 0;
    }
    // Special case for name/email/address (string)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (sortDirection === 'asc') return aValue.localeCompare(bValue);
      return bValue.localeCompare(aValue);
    }
    // Fallback for others
    if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const paginatedCompanies = filteredCompanies.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  }

  // Reset to page 1 when search or filter changes
  useEffect(() => { setPage(1); }, [search, sortField, sortDirection]);

  const fetchCompanies = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Check sessionStorage first if not forcing refresh
      const cachedData = sessionStorage.getItem('companies');
      if (cachedData && !forceRefresh) {
        const data = JSON.parse(cachedData);
        setCompanies(data);
        setLoading(false);
        return;
      }

      const result = await api.get<ApiResponse<Company[]>>('jobs/company');

      if (result.code === 200 && result.status === 'OK' && Array.isArray(result.data)) {
        sessionStorage.setItem('companies', JSON.stringify(result.data));
        setCompanies(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCompanies();
  }, []);

  const toggleUserStatus = async (user: Company) => {
    try {
      await api.put(`status/company/${user.id}`, { status: !user.status, updatedBy: user.id });
      showNotification('success', language === 'en' ? 'Status updated successfully' : 'อัปเดตสถานะสำเร็จ');
      // Fetch fresh data without showing loading indicator
      fetchCompanies(true);
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', language === 'en' ? 'Failed to update status' : 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });


  // Show notification
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 1000);
  };

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
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {language === 'en' ? 'Master Data > ManPower Demand' : 'Master Data > ผู้ว่าจ้าง'}
          </h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
              {language === 'en' ? 'Search' : 'ค้นหา'}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-hover:text-teal-500">
                <svg className="h-5 w-5 text-gray-400 group-hover:text-teal-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full pl-12 pr-4 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 hover:shadow-md focus:shadow-lg outline-none"
                placeholder={language === 'en' ? 'Search...' : 'ค้นหา...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-white">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center mt-7.5">
              {/* Fetch/Refresh Button */}
              <button
                type="button"
                onClick={() => fetchCompanies(true)}
                className="inline-flex cursor-pointer items-center px-4 py-2 border border-blue-500 rounded-md bg-white text-blue-500 font-medium shadow hover:bg-blue-50 transition ml-0 md:ml-2"
                title={language === 'en' ? 'Refresh Data' : 'รีเฟรชข้อมูล'}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {language === 'en' ? 'Fetch' : 'ดึงข้อมูล'}
              </button>
              {/* Create Button */}
              <Link
                to="/company/create"
                className="inline-flex cursor-pointer items-center px-4 py-2 border border-blue-500 rounded-md bg-blue-500 text-white font-medium shadow hover:bg-blue-600 transition ml-0 md:ml-2"
              >
                + {language === 'en' ? 'Add ManPower Demand' : 'สร้างผู้ว่าจ้าง'}
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Card Layer */}
      <div className="border-2 border-blue-400 rounded-xl bg-white shadow-lg px-0 pt-0 pb-2 overflow-hidden flex flex-col" style={{ minHeight: 400 }}>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-left border-b border-blue-200">#</th>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-left border-b border-blue-200 cursor-pointer select-none" onClick={() => handleSort('name')}>
                    {language === 'en' ? 'ManPower Demand' : 'ผู้ว่าจ้าง'}
                    {sortField === 'name' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-left border-b border-blue-200 cursor-pointer select-none" onClick={() => handleSort('email')}>
                    {language === 'en' ? 'Email' : 'อีเมล'}
                    {sortField === 'email' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-left border-b border-blue-200 cursor-pointer select-none" onClick={() => handleSort('address')}>
                    {language === 'en' ? 'Address' : 'ที่อยู่'}
                    {sortField === 'address' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-center border-b border-blue-200 cursor-pointer select-none" onClick={() => handleSort('status')}>
                    {language === 'en' ? 'Status' : 'สถานะ'}
                    {sortField === 'status' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-center border-b border-blue-200">{language === 'en' ? 'Edit' : 'แก้ไข'}</th>
                  <th className="px-4 py-2 font-semibold text-blue-900 text-center border-b border-blue-200">{language === 'en' ? 'Delete' : 'ลบ'}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCompanies.map((company, index) => (
                  <tr key={company.id}>
                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{company.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{company.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{company.address}</td>
                    <td className="px-4 py-2 text-center">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleUserStatus(company)}
                        className={`relative cursor-pointer inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${company.status ? 'bg-[var(--color-primary,#0038A8)]' : 'bg-gray-200'}`}
                      >
                        <span className="sr-only">{language === 'en' ? 'Toggle status' : 'สลับสถานะ'}</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${company.status ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                      <span className="ml-2 text-sm">
                        {company.status ?
                          (language === 'en' ? 'Active' : 'ใช้งาน') :
                          (language === 'en' ? 'Inactive' : 'ไม่ใช้งาน')
                        }
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Link
                        to={`/company/edit/${company.id}`}
                        title={language === 'en' ? 'Edit' : 'แก้ไข'}
                        aria-label={language === 'en' ? 'Edit' : 'แก้ไข'}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-100 transition"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6M3 17v4h4l10-10-4-4L3 17z" />
                        </svg>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setDeleteDialogOpen(true);
                        }}
                        title={language === 'en' ? 'Delete' : 'ลบ'}
                        aria-label={language === 'en' ? 'Delete' : 'ลบ'}
                        className="inline-flex cursor-pointer items-center justify-center w-8 h-8 rounded hover:bg-red-100 transition"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2 border-t border-blue-100 bg-blue-50">
            <span className="text-xs text-blue-900">
              {language === 'en'
                ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredCompanies.length)} of ${filteredCompanies.length} items`
                : `แสดง ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredCompanies.length)} จาก ${filteredCompanies.length} รายการ`}
            </span>
            <div className="flex gap-1">
              <button
                className="px-2 py-1 rounded border border-blue-200 bg-white text-blue-500 hover:bg-blue-100 disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded border border-blue-200 ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white text-blue-700'} hover:bg-blue-100`}
                  onClick={() => setPage(i + 1)}
                  disabled={page === i + 1}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-2 py-1 rounded border border-blue-200 bg-white text-blue-500 hover:bg-blue-100 disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                &gt;
              </button>
            </div>
          </div>

          <AlertDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedCompanyId(null);
            }}
            onConfirm={async () => {
              if (selectedCompanyId) {
                try {
                  const success = await deleteItem('company', selectedCompanyId);
                  if (success) {
                    fetchCompanies(true);
                    setDeleteDialogOpen(false);
                  }
                } catch (error) {
                  console.error('Failed to delete ManPower Demand:', error);
                  setDeleteDialogOpen(false);
                  setSelectedCompanyId(null);
                }
              }
            }}
            title={language === 'en' ? 'Delete ManPower Demand' : 'ลบผู้ว่าจ้าง'}
            message={language === 'en' ? 'Are you sure you want to delete this ManPower Demand?' : 'คุณแน่ใจหรือไม่ที่จะลบผู้ว่าจ้างนี้?'}
          />
        </div>
      </div>
    </div >
  );
}
