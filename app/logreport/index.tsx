import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../components/DashboardLayout';
import { useAdminLogs } from './useAdminLogs';
import { useUsers } from './useUsers';
import { LogsTable } from './LogsTable';
import { Pagination } from './Pagination';
import { useDebounce } from './utils';
import { X } from 'lucide-react';
import type { LogStatus, LogFilters, Language } from './types';
import { ACTION_TYPE_OPTIONS, STATUS_OPTIONS } from './config/statusOptions';
import { DateRangePicker } from './components/DateRangePicker';
import { SearchBar } from './components/SearchBar';
import { FilterSelect } from './components/FilterSelect';

export default function AdminLogsPage() {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Omit<LogFilters, 'searchTerm'>>({
        userId: 'All',
        status: 'All',
        actionType: 'All',
        startDate: '',
        endDate: ''
    });
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const { language } = useLanguage();

    // Initialize pagination state
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

    const handleFilterChange = (key: keyof typeof filters, value: any) => {
        console.log(`Filter changed - ${key}:`, value);

        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    const combinedFilters = useMemo(() => ({
        searchTerm: debouncedSearchTerm,
        status: filters.status,
        actionType: filters.actionType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        userId: filters.userId
    }), [debouncedSearchTerm, filters]);

    const { users, loading: usersLoading } = useUsers();
    const { logs, loading, refetch, pagination } = useAdminLogs(
        combinedFilters,
        currentPage,
        pageSize,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        // Scroll to top of the table
        window.scrollTo({ top: 0, behavior: 'smooth' });
        refetch(newPage, pageSize);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when page size changes
        refetch(currentPage, size);
    };

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        params.set('page', currentPage.toString());
        params.set('pageSize', pageSize.toString());
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
        refetch(currentPage, pageSize);
    }, [currentPage, pageSize, searchParams]);

    return (
        <div className="w-full">
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {language === 'en' ? 'Log Report' : 'รายงานการทำงาน'}
                    </h1>
                </div>

                <div className="mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <SearchBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            language={language as Language}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <FilterSelect
                            value={filters?.userId || 'All'}
                            onChange={(value) => handleFilterChange('userId', value as LogStatus)}
                            options={users.map(user => ({ value: user.id, label: { en: user.name, th: user.name } }))}
                            allLabel={language === 'en' ? 'All Users' : 'ผู้ใช้ทั้งหมด'}
                            language={language as Language}
                        />

                        <FilterSelect
                            value={filters?.status || 'All'}
                            onChange={(value) => handleFilterChange('status', value as LogStatus)}
                            options={STATUS_OPTIONS.filter(opt => opt.value !== 'All')}
                            allLabel={language === 'en' ? 'All Statuses' : 'สถานะทั้งหมด'}
                            language={language as Language}
                        />

                        <FilterSelect
                            value={filters?.actionType || 'All'}
                            onChange={(value) => handleFilterChange('actionType', value)}
                            options={ACTION_TYPE_OPTIONS}
                            allLabel={language === 'en' ? 'All Actions' : 'การดำเนินการทั้งหมด'}
                            language={language as Language}
                        />

                        <DateRangePicker
                            startDate={filters.startDate || ''}
                            endDate={filters.endDate || ''}
                            onDateChange={({ startDate, endDate }) => {
                                setFilters(prev => ({
                                    ...prev,
                                    startDate,
                                    endDate
                                }));
                            }}
                            onClear={() => {
                                setFilters(prev => ({
                                    ...prev,
                                    startDate: '',
                                    endDate: ''
                                }));
                            }}
                            language={language as Language}
                        />

                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilters({
                                    userId: 'All',
                                    status: 'All',
                                    actionType: 'All',
                                    startDate: '',
                                    endDate: ''
                                });
                                setCurrentPage(1);
                                refetch(1, pageSize);
                            }}
                            className="text-sm cursor-pointer font-medium text-red-600 hover:text-red-500 ml-2 flex items-center border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {language === 'en' ? 'Clear Filters' : 'ล้างตัวกรอง'}
                        </button>
                    </div>

                    {/* Active Filters */}
                    {(searchTerm || filters.status !== 'All' || filters.actionType !== 'All' || filters.userId !== 'All') && (
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {language === 'en' ? 'Search' : 'ค้นหา'}: {searchTerm}
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {filters.userId !== 'All' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {language === 'en' ? 'User' : 'ผู้ใช้'}: {users.find(user => user.id === filters.userId)?.name || filters.userId}
                                    <button
                                        onClick={() => handleFilterChange('userId', 'All')}
                                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {filters.status !== 'All' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {language === 'en' ? 'Status' : 'สถานะ'}: {STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label[language === 'en' ? 'en' : 'th']}
                                    <button
                                        onClick={() => handleFilterChange('status', 'All')}
                                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {filters.startDate && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {language === 'en' ? 'Start Date' : 'วันที่เริ่มต้น'}: {filters.startDate}
                                    <button
                                        onClick={() => handleFilterChange('startDate', '')}
                                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {filters.endDate && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {language === 'en' ? 'End Date' : 'วันที่สิ้นสุด'}: {filters.endDate}
                                    <button
                                        onClick={() => handleFilterChange('endDate', '')}
                                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {filters.actionType !== 'All' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    {language === 'en' ? 'Action' : 'การดำเนินการ'}: {ACTION_TYPE_OPTIONS.find(opt => opt.value === filters.actionType)?.label[language === 'en' ? 'en' : 'th']}
                                    <button
                                        onClick={() => handleFilterChange('actionType', 'All')}
                                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-purple-200 text-purple-600 hover:bg-purple-300"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}


                            {(searchTerm || filters.status !== 'All' || filters.actionType !== 'All' || filters.startDate || filters.endDate || filters.userId) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilters({
                                            ...filters,
                                            status: 'All',
                                            actionType: 'All',
                                            startDate: '',
                                            endDate: '',
                                            userId: 'All'
                                        });
                                    }}
                                    className="text-sm cursor-pointer font-medium text-blue-600 hover:text-blue-500 ml-2 flex items-center"
                                >
                                    {language === 'en' ? 'Clear all' : 'ล้างทั้งหมด'}
                                </button>
                            )}

                            <button
                                onClick={() => refetch(currentPage, pageSize)}
                                className="text-sm cursor-pointer font-medium text-blue-600 hover:text-blue-500 ml-2 flex items-center"
                            >
                                {language === 'en' ? 'Refresh' : 'รีเฟรช'}
                            </button>
                        </div>
                    )}
                </div>

                <LogsTable
                    logs={logs}
                    loading={loading}
                    language={language}
                    currentPage={currentPage}
                    pageSize={pageSize}
                />

                <Pagination
                    pagination={{
                        currentPage,
                        pageSize,
                        totalItems: pagination?.totalItems || 0,
                        totalPages: pagination?.totalPages || 1
                    }}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    language={language}
                />
            </div>
        </div>
    );
}