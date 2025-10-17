import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationType } from '../types';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  language: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  language,
}) => {
  const { current_page, total_pages, total_items, limit } = pagination;
  const startItem = total_items > 0 ? (current_page - 1) * limit + 1 : 0;
  const endItem = Math.min(current_page * limit, total_items);

  return (
    <div className="w-full px-4 py-1 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Page Info - Moved to Right */}
      <div className="text-sm text-gray-500 whitespace-nowrap">
        {language === 'en'
          ? `Showing ${startItem} to ${endItem} of ${total_items} entries`
          : `แสดง ${startItem} ถึง ${endItem} จากทั้งหมด ${total_items} รายการ`}
      </div>

      {/* Pagination Controls - Moved to Left */}
      <div className="flex items-center gap-3">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 whitespace-nowrap">
            {language === 'en' ? 'Rows per page:' : 'แถวต่อหน้า:'}
          </span>
          <select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="pl-2 pr-8 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center border border-gray-200 rounded-md divide-x divide-gray-200 overflow-hidden">
          <button
            onClick={() => onPageChange(current_page - 1)}
            disabled={current_page === 1}
            className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors duration-150"
            aria-label={language === 'en' ? 'Previous page' : 'หน้าก่อนหน้า'}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="px-4 py-1.5 bg-gray-50 text-gray-700 font-medium">
            {current_page} / {total_pages}
          </div>

          <button
            onClick={() => onPageChange(current_page + 1)}
            disabled={current_page >= total_pages}
            className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors duration-150"
            aria-label={language === 'en' ? 'Next page' : 'หน้าถัดไป'}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
