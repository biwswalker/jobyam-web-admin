"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '~/locales';
import { useLanguage } from '../components/DashboardLayout';
import advisorService from '~/services/advisorService';
import type { AdvisorUser } from '~/services/advisorService';
import useUserInfo from "~/hooks/useUserInfo";
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

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    perPage?: number; // Keeping for backward compatibility
}

export default function AdvisorUsersPage() {
    const navigate = useNavigate();
    const { toast } = useSimpleToast();
    const { language } = useLanguage();
    const { userInfo, isLoading: isLoadingUser } = useUserInfo() || {};

    // State
    const [users, setUsers] = useState<AdvisorUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [updatingPayment, setUpdatingPayment] = useState<Record<string, boolean>>({});

    const handlePaymentToggle = async (userId: string, newStatus: boolean) => {
        try {
            // Set loading state for this specific toggle
            setUpdatingPayment(prev => ({ ...prev, [userId]: true }));

            // Make API call to update payment status
            await advisorService.updateAdvisorUser(userId,  { advisorPayment: newStatus, updatedBy: userInfo?.id || '' });

            // Update local state on success
            setUsers(users.map(user =>
                user.id === userId ? { ...user, advisorPayment: newStatus } : user
            ));

            // Show success message
            toast.success('Success', t('paymentStatusUpdated', language));
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Error', t('updateFailed', language));
        } finally {
            // Reset loading state
            setUpdatingPayment(prev => ({ ...prev, [userId]: false }));
        }
    };
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10,
        perPage: 10 // For backward compatibility
    });

    // Handle search params from URL and fetch data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const page = parseInt(params.get('page') || '1');
            const limit = parseInt(params.get('limit') || '10');
            const search = params.get('search') || '';

            setSearchTerm(search);
            setPagination(prev => ({
                ...prev,
                currentPage: page,
                pageSize: limit,
                perPage: limit // For backward compatibility
            }));
        }
    }, []);

    // Fetch advisor users when component mounts or when dependencies change
    useEffect(() => {
        if (!isLoadingUser) {
            fetchAdvisorUsers();
        }
    }, [pagination.currentPage, pagination.pageSize, searchTerm, userInfo?.id, isLoadingUser]);

    // Fetch advisor users
    const fetchAdvisorUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Ensure pagination has default values if undefined
            const currentPage = pagination?.currentPage || 1;
            const pageSize = pagination?.pageSize || 10;

            // If still loading user info, don't proceed
            if (isLoadingUser) return;

            const response = await advisorService.getAdvisorUsers({
                id: userInfo?.id || '',
                page: currentPage,
                limit: pageSize,
                search: searchTerm
            });

            // Extract users and pagination data from the response
            const usersData = Array.isArray(response.data) ? response.data : [];
            const paginationData = response.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                perPage: pageSize
            };

            setUsers(usersData);
            setPagination(prev => ({
                ...prev,
                currentPage: Number(paginationData.currentPage) || 1,
                totalPages: Number(paginationData.totalPages) || 1,
                totalItems: Number(paginationData.totalItems) || 0,
                pageSize: Number(paginationData.perPage) || pageSize
            }));

        } catch (err) {
            console.error('Error fetching advisor users:', err);
            const errorMessage = typeof t === 'function' ? t('errorFetchingUsers', language) : 'Failed to fetch users';
            setError(errorMessage);
            if (toast?.error) {
                toast.error('Error', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const newPagination = { ...pagination, currentPage: 1 };
        navigate(`/advisors?page=1&limit=${pagination.pageSize}&search=${encodeURIComponent(searchTerm)}`);
        setPagination(newPagination);
        fetchAdvisorUsers();
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page < 1 || page > pagination.totalPages) return;

        const newPagination = { ...pagination, currentPage: page };
        setPagination(newPagination);

        navigate(`/advisors?page=${page}&limit=${pagination.pageSize}&search=${encodeURIComponent(searchTerm)}`);
        fetchAdvisorUsers();
    };

    // Handle per page change
    const handlePerPageChange = (newPageSize: number) => {
        const newPagination = {
            ...pagination,
            pageSize: newPageSize,
            currentPage: 1
        };
        setPagination(newPagination);

        navigate(`/advisors?page=1&limit=${newPageSize}&search=${encodeURIComponent(searchTerm)}`);
        fetchAdvisorUsers();
    };

    // Initial fetch
    useEffect(() => {
        fetchAdvisorUsers();
    }, []);

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Custom pagination component
    const PaginationControls = ({
        currentPage,
        totalPages,
        onPageChange,
        onPageSizeChange,
        pageSize,
        totalItems
    }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
        pageSize: number;
        totalItems: number;
    }) => {
        return (
            <div className="flex items-center justify-between mt-4 w-full">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                        {t('showingItemsPerPage', language, { count: pageSize })}
                    </span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="h-8 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[10, 20, 30, 40, 50].map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('previousPage', language)}
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                        {t('page', language)} {currentPage} {t('of', language)} {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('nextPage', language)}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full px-2 sm:px-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('advisors', language)}</h1>
            </div>

            <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">{t('searchUsers', language)}</h2>
                    <p className="mt-1 text-sm text-gray-500">{t('searchBy', language)}</p>
                </div>
                <div className="px-6 pb-6 pt-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder={t('searchBy', language)}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full cursor-pointer pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center cursor-pointer justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('searching', language)}
                                </>
                            ) : (
                                <>
                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    {t('search', language)}
                                </>
                            )}
                        </button>
                        <button
                            onClick={fetchAdvisorUsers}
                            className="inline-flex cursor-pointer items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
                            disabled={loading}
                        >
                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('refresh', language)}
                        </button>
                    </form>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <div className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{t('error', language)}</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('name', language)}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('phone', language)}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('birthDay', language)}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('advisorName', language)}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('advisorNumber', language)}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('advisorPayment', language)}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                // Loading skeleton
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                                        {t('noUsersFound', language)}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.advisorName || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.birthDay)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.advisorNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    className={`relative cursor-pointer inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${user.advisorPayment ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                    onClick={() => handlePaymentToggle(user.id, !user.advisorPayment)}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.advisorPayment ? 'translate-x-6' : 'translate-x-1'}`}
                                                    />
                                                </button>
                                                <span className="ml-2 text-sm font-medium text-gray-700">
                                                    {user.advisorPayment ? t('paid', language) : t('unpaid', language)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* <div className="text-sm text-gray-600">
                            {t('showingItemsPerPage', language, { count: pagination.pageSize })} <span className="font-medium">
                                {pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1}
                            </span> {t('to', language)}{' '}
                            <span className="font-medium">
                                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                            </span>{' '}
                            {t('of', language)} <span className="font-medium">{pagination.totalItems}</span> {t('items', language)}
                        </div> */}

                        <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            pageSize={pagination.pageSize}
                            totalItems={pagination.totalItems}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePerPageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
