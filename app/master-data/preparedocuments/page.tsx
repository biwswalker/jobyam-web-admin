import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { t } from '~/locales';
import { useLanguage } from '../../components/DashboardLayout';
import {
  getDocuments,
  deleteDocument,
  updateDocument,
  type Document
} from '../../services/preparedocuments';
import type { ApiResponse } from '~/services/api';
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

export default function PrepareDocumentsPage() {
  const navigate = useNavigate();
  const { toast } = useSimpleToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Document[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const { language } = useLanguage();

  const fetchDocuments = useCallback(async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      // Make sure to pass the pageSize as pageSize to the API
      const response = await getDocuments(page, pageSize, search);

      if (response) {
        const { data, pagination: apiPagination } = response;
        
        setPlans(Array.isArray(data) ? data : []);
        
        if (apiPagination) {
          const { itemsPerPage, ...rest } = apiPagination;
          setPagination(prev => ({
            ...prev,
            currentPage: rest.currentPage || 1,
            pageSize: pageSize, // Always use the pageSize we requested
            totalItems: rest.totalItems || 0,
            totalPages: rest.totalPages || 1
          }));
        } else {
          setPlans([]);
        }
      } else {
        setPlans([]);
      }
    } catch (error) {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Single useEffect to handle both initial load and search term changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setPagination(prev => ({
          ...prev,
          currentPage: 1
        }));
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Main effect for data fetching
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        await fetchDocuments(pagination.currentPage, pagination.pageSize, debouncedSearchTerm);
      } catch (error) {
        if (!controller.signal.aborted) {
        }
      }
    };

    fetchData();
    
    return () => {
      controller.abort();
    };
  }, [fetchDocuments, pagination.currentPage, pagination.pageSize, debouncedSearchTerm]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value);
    if (newPageSize !== pagination.pageSize) {
      setPagination({
        ...pagination,
        pageSize: newPageSize,
        currentPage: 1
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteDocument(id);

      if (response === 200) {
        // No need to pass parameters since they're already in state
        await fetchDocuments();
        toast.success('Success', t('documentDeletedSuccessfully', language));
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      toast.error('Error', t('failedToDeleteDocument', language));
    }
  };

  const columns = [
    {
      accessorKey: 'seq',
      header: t('sequence', language),
      cell: ({ row }: { row: { original: Document } }) => (
        <div className="text-center">{row.original.seq}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('name', language),
    },
    // {
    //   accessorKey: 'description',
    //   header: t('detail', language),
    //   cell: ({ row }: { row: { original: Document } }) => (
    //     <div className="line-clamp-2">{row.original.description}</div>
    //   ),
    // },
    // {
    //   accessorKey: 'sampleDoc',
    //   header: t('sampleDocument', language),
    //   cell: ({ row }: { row: { original: Document } }) => (
    //     row.original.sampleDoc ? (
    //       <a 
    //         href={row.original.sampleDoc} 
    //         target="_blank" 
    //         rel="noopener noreferrer"
    //         className="text-blue-600 hover:underline"
    //       >
    //         {t('viewDocument', language)}
    //       </a>
    //     ) : (
    //       <span className="text-gray-400">-</span>
    //     )
    //   ),
    // },
    {
      accessorKey: 'templateName',
      header: t('templateName', language),
    },
    // {
    //   accessorKey: 'formTemplates',
    //   header: t('formTemplates', language),
    //   cell: ({ row }: { row: { original: Document } }) => (
    //     row.original.formTemplates ? (
    //       <a 
    //         href={row.original.formTemplates} 
    //         target="_blank" 
    //         rel="noopener noreferrer"
    //         className="text-blue-600 hover:underline"
    //       >
    //         {t('downloadTemplate', language)}
    //       </a>
    //     ) : (
    //       <span className="text-gray-400">-</span>
    //     )
    //   ),
    // },
    {
      accessorKey: 'fileDownload',
      header: t('fileDownload', language),
      cell: ({ row }: { row: { original: Document } }) => (
        row.original.fileDownload ? (
          <a 
            href={row.original.fileDownload} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {t('downloadTemplate', language)}
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/preparedocuments/edit/${row.original.id}`)}
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
        <h1 className="text-2xl font-bold">{t('prepareDocuments', language)}</h1>
        <button
          onClick={() => navigate('/preparedocuments/create')}
          className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          {t('createNewDocument', language)}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">{t('listOfDocument', language)}</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder={t('search', language)}
              className="h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDocuments(1, pagination.pageSize, searchTerm)}
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
                {t('showing', language)} {pagination.pageSize} {t('itemsPerPage', language)}
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
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
