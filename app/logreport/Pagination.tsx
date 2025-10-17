import type { PaginationState } from './types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  language: string;
  isLoading?: boolean;
}

const pageSizeOptions = [10, 20, 30, 40, 50];

export const Pagination = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  language,
  isLoading = false,
}: PaginationProps) => {
  const { currentPage, pageSize, totalItems, totalPages } = pagination;
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to show (with ellipsis)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Common button classes
  const baseButtonClass = 'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200';
  const activeButtonClass = 'bg-blue-600 text-white hover:bg-blue-700';
  const inactiveButtonClass = 'text-gray-600 hover:bg-gray-100';
  const disabledButtonClass = 'text-gray-300 cursor-not-allowed bg-gray-50';
  const loadingButtonClass = 'opacity-50 cursor-wait';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {language === 'en' ? 'Show' : 'แสดง'}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="block w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">
          {language === 'en' ? 'per page' : 'รายการต่อหน้า'}
        </span>
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-600">
        {language === 'en' ? 'Showing' : 'แสดง'} <span className="font-medium">{startItem}</span> {language === 'en' ? 'to' : 'ถึง'} <span className="font-medium">{endItem}</span> {language === 'en' ? 'of' : 'จาก'} <span className="font-medium">{totalItems}</span> {language === 'en' ? 'results' : 'รายการ'}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* First page button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={`${baseButtonClass} ${currentPage === 1 ? disabledButtonClass : inactiveButtonClass}`}
          aria-label={language === 'en' ? 'First page' : 'หน้าแรก'}
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${baseButtonClass} ${currentPage === 1 ? disabledButtonClass : inactiveButtonClass}`}
          aria-label={language === 'en' ? 'Previous' : 'ก่อนหน้า'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page numbers */}
        {pageNumbers[0] > 1 && (
          <span className="px-2 text-gray-400">...</span>
        )}
        
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`${baseButtonClass} ${
              page === currentPage 
                ? activeButtonClass 
                : inactiveButtonClass
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <span className="px-2 text-gray-400">...</span>
        )}

        {/* Next page button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`${baseButtonClass} ${currentPage >= totalPages ? disabledButtonClass : inactiveButtonClass}`}
          aria-label={language === 'en' ? 'Next' : 'ถัดไป'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className={`${baseButtonClass} ${currentPage >= totalPages ? disabledButtonClass : inactiveButtonClass}`}
          aria-label={language === 'en' ? 'Last page' : 'หน้าสุดท้าย'}
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
