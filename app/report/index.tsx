import { useParams } from 'react-router-dom';
import { useLanguage } from '../components/DashboardLayout';

// Components
import { ReportTable } from './components/ReportTable';
import { Pagination } from './components/Pagination';
import { SearchBar, SearchFilter } from './components/SearchBar';
import { ResetFilters } from './components/ResetFilters';

// Hooks
import { useReportData } from './hooks/useReportData';
import { usePagination } from './hooks/usePagination';
import { useSearch } from './hooks/useSearch';

// Types
import { REPORT_TITLES } from './types';

export default function ReportPage() {
  const { reportType } = useParams<{ reportType: string }>();
  const { language } = useLanguage();

  // Search
  const { searchTerm, setSearchTerm, debouncedSearchTerm, clearSearch } = useSearch();

  // Pagination
  const {
    pageSize,
    currentPage,
    setPageSize,
    setCurrentPage,
    resetPagination
  } = usePagination();

  // Fetch report data and get export function
  const { reportData, loading, exportToExcel } = useReportData(
    reportType || '',
    currentPage,
    pageSize,
    debouncedSearchTerm
  );

  // Handle export to Excel
  const handleExport = async () => {
    try {
      await exportToExcel();
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show an error toast/message here
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    clearSearch();
    resetPagination();
  };

  // Get report title based on report type
  const getReportTitle = () => {
    if (!reportType) return language === 'en' ? 'Report' : 'รายงาน';
    const title = REPORT_TITLES[reportType];
    return title ? (language === 'en' ? title.en : title.th) : (language === 'en' ? 'Report' : 'รายงาน');
  };

  return (
    <div className="w-full bg-gray-50 py-2 px-2 sm:px-6 lg:px-2">
      <div className="w-full mx-auto">


        {/* Search and filters */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {getReportTitle()}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {language === 'en'
                    ? 'View and manage your reports'
                    : 'ดูและจัดการรายงานของคุณ'}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  onClick={handleExport}
                  disabled={loading || !reportData?.data?.length}
                  className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {language === 'en' ? 'Export to Excel' : 'ส่งออก Excel'}
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onReset={resetPagination}
                    language={language}
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <ResetFilters
                    onReset={handleResetFilters}
                    language={language}
                  />
                </div>
              </div>
              
              {searchTerm && (
                <div className="flex-shrink-0">
                  <SearchFilter
                    searchTerm={searchTerm}
                    onClear={clearSearch}
                    language={language}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* <div className="overflow-x-auto"> */}
            <ReportTable
              data={reportData}
              loading={loading}
              reportType={reportType || ''}
              language={language}
            />
          {/* </div> */}

          {/* Pagination */}
          {reportData && (
            // <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <Pagination
                pagination={{
                  current_page: reportData.current_page,
                  total_pages: reportData.total_pages,
                  total_items: reportData.total_items,
                  limit: reportData.limit
                }}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                language={language}
              />
            // </div>
          )}
        </div>
      </div>
    </div>
  );
}