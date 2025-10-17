import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import StatusToggle from '../../components/StatusToggle';
import { t } from '~/locales';
import { useLanguage } from '../../components/DashboardLayout';
import {
  getTemplatePlans,
  deleteTemplatePlan,
  updateTemplatePlanStatus,
  type TemplatePlan
} from '../../services/templatePlanService';
// Custom toast notification function
const useSimpleToast = () => {
  const showToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white z-50`;
    toast.innerHTML = `
      <h3 class="font-bold">${title}</h3>
      <p>${description}</p>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };
  return { toast: { success: showToast, error: showToast } };
};

interface JobType {
  id: string;
  name: string;
  subName: string;
}

// TemplatePlan interface is now imported from the service

export default function TemplatePlansPage() {
  const navigate = useNavigate();
  const { toast } = useSimpleToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<TemplatePlan[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TemplatePlan | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { language } = useLanguage();

  const fetchPlans = async (pageNum = page, pageSizeNum = pageSize, search = searchTerm) => {
    try {
      setLoading(true);
      const response = await getTemplatePlans(pageNum, pageSizeNum, search);

      if (response.code === 200) {
        setPlans(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Error', t('errorFetchingTemplatePlans', language));
    } finally {
      setLoading(false);
    }
  };

  // Only one useEffect is needed
  useEffect(() => {
    fetchPlans();
  }, [page, pageSize, searchTerm]);

  // Handle search input change with debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Update searchTerm and reset to first page when debouncedSearchTerm changes
  useEffect(() => {
    setPage(1);
    fetchPlans(1, pageSize, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handlePageChange = (newPage: number) => {
    fetchPlans(newPage, pageSize, searchTerm);
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value);
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: 1 // Reset to first page when changing page size
    }));
    fetchPlans(1, newPageSize, searchTerm);
  };

  const handleStatusToggle = async (id: string, status: boolean) => {
    try {
      const response = await updateTemplatePlanStatus(id, status);

      if (response.code === 200) {
        await fetchPlans(pagination.currentPage, pagination.pageSize, searchTerm);
        toast.success('Success', t('planStatusUpdatedSuccessfully', language));
      } else {
        throw new Error(response.message || 'Failed to update plan status');
      }
    } catch (error) {
      toast.error('Error', t('failedToUpdatePlanStatus', language));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteTemplatePlan(id);

      if (response.code === 200) {
        await fetchPlans(pagination.currentPage, pagination.pageSize, searchTerm);
        toast.success('Success', t('planDeletedSuccessfully', language));
      } else {
        throw new Error(response.message || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error', t('failedToDeletePlan', language));
    }
  };

  const columns = [
    {
      accessorKey: 'sequence',
      header: t('sequence', language),
      cell: ({ row }: { row: any }) => (
        <div className="text-center">{row.original.sequence}</div>
      ),
    },
    {
      accessorKey: 'planName',
      header: t('planName', language),
    },
    {
      accessorKey: 'jobType',
      header: t('jobType', language),
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.jobType.map((job: JobType) => (
            <span
              key={job.id}
              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
            >
              {job.name} {job.subName && `(${job.subName})`}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'สถานะ',
      cell: ({ row }: { row: any }) => (
        <StatusToggle
          id={row.original.id}
          initialStatus={row.original.status}
          type="jobType"
          onStatusChange={(newStatus) =>
            handleStatusToggle(row.original.id, newStatus)
          }
        />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/templateplans/edit/${row.original.id}`)}
            className="p-1 cursor-pointer text-gray-600 hover:text-blue-600"
            title={t('edit', language)}
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1 cursor-pointer text-gray-600 hover:text-red-600"
            title={t('delete', language)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full p-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('templatePlans', language)}</h1>
        <button
          onClick={() => navigate('/templateplans/create')}
          className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          {t('createNewTemplatePlan', language)}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">{t('listOfPlans', language)}</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder={t('search', language)}
              className="h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPlans(1, pagination.pageSize, searchTerm)}
            />
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">{t('loading', language)}</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('noDataFound', language)}</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.accessorKey || column.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      {columns.map((column) => (
                        <td key={`${plan.id}-${column.accessorKey || column.id}`} className="px-6 py-4 whitespace-nowrap">
                          {column.cell ? (
                            column.cell({ row: { original: plan } })
                          ) : (
                            <>{String(plan[column.accessorKey as keyof typeof plan] || '')}</>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm cursor-pointer text-gray-600">
                {t('showing', language)} {pageSize} {t('itemsPerPage', language)}
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  handlePageSizeChange(e.target.value);
                }}
                className="h-8 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 20, 30, 40, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`px-3 cursor-pointer py-1 rounded-md ${pagination.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {t('previous', language)}
              </button>
              <span className="px-3 cursor-pointer py-1">
                {t('page', language)} {pagination.currentPage} {t('of', language)} {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className={`px-3 cursor-pointer py-1 rounded-md ${pagination.currentPage >= pagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {t('next', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
