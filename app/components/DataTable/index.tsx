import React, { useState } from 'react';

// Replace the icons with inline SVG components
const ChevronUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
    </svg>
);

interface DataTableProps<T> {
    data: T[];
    columns: {
        key: string;
        title: string;
        render?: (item: T) => React.ReactNode;
        sortable?: boolean;
        width?: string | number;
    }[];
    onRowClick?: (item: T) => void;
    keyExtractor: (item: T) => string;
    pagination?: {
        pageSize: number;
        currentPage: number;
        onPageChange: (page: number) => void;
        totalItems: number;
    };
    className?: string;
}

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    keyExtractor,
    pagination,
    className = ''
}: DataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a: any, b: any) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    // Pagination logic
    const pageCount = pagination ? Math.ceil(pagination.totalItems / pagination.pageSize) : 1;
    const paginatedData = pagination
        ? sortedData.slice(
            (pagination.currentPage - 1) * pagination.pageSize,
            pagination.currentPage * pagination.pageSize
        )
        : sortedData;

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => column.sortable && handleSort(column.key)}
                                style={{ width: column.width || 'auto' }}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>{column.title}</span>
                                    {column.sortable && (
                                        <span className="inline-flex flex-col">
                                            <ChevronUpIcon
                                                className={`h-3 w-3 ${sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                                    ? 'text-[var(--color-primary,#0038A8)]'
                                                    : 'text-gray-400'
                                                    }`}
                                            />
                                            <ChevronDownIcon
                                                className={`h-3 w-3 -mt-1 ${sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                                    ? 'text-[var(--color-primary,#0038A8)]'
                                                    : 'text-gray-400'
                                                    }`}
                                            />
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        paginatedData.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(item)}
                            >
                                {columns.map((column) => (
                                    <td key={`${keyExtractor(item)}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                                        {column.render ? column.render(item) : (item as any)[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {pagination && pageCount > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pageCount}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.currentPage === pageCount
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                                </span>{' '}
                                of <span className="font-medium">{pagination.totalItems}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="sr-only">Previous</span>
                                    <span aria-hidden="true">&laquo;</span>
                                </button>
                                {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => pagination.onPageChange(page)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                                            ? 'z-10 bg-[var(--color-primary,#0038A8)] text-white border-[var(--color-primary,#0038A8)]'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pageCount}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.currentPage === pageCount
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="sr-only">Next</span>
                                    <span aria-hidden="true">&raquo;</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}