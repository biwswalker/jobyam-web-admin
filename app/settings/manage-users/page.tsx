import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertDialog from '../../../components/shared/AlertDialog';
import { useLanguage } from '../../components/DashboardLayout';
import api from '../../services/api';

// Updated User interface to match API response
interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  birthDay: string;
  contactName: string;
  contactNumber: string;
  relationship: string;
  status: boolean;
  role: {
    id: string;
    name: string;
  };
}

interface PaginatedResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
  message?: string;
}

type DeleteType = 'users' | 'role' | 'company' | 'jobtype';

export function meta() {
  return [
    { title: "Users - JobYam Admin" },
    { name: "description", content: "Manage Users" },
  ];
}

export default function UsersPage() {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Pagination state
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Available roles for filtering
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const userRan = useRef(false);
  const roleRan = useRef(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });

  // Fetch roles for filter dropdown
  const fetchRoles = async () => {
    try {
      // if (roleRan.current) return;
      // roleRan.current = true;
      const result = await api.get<ApiResponse<{ id: string, name: string }[]>>('role');
      if (result.code === 200 && result.status === 'OK' && Array.isArray(result.data)) {
        setRoles(result.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async (forceRefresh = false) => {
    try {
      // if (userRan.current) return;
      // userRan.current = true;
      setLoading(true);

      // Build query parameters for API request
      const offset = (currentPage - 1) * pageSize;
      let queryParams = `type=user&limit=${pageSize}&offset=${offset}`;

      // Add filters if they exist
      if (searchQuery) queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      if (roleFilter) queryParams += `&role=${encodeURIComponent(roleFilter)}`;
      if (statusFilter) queryParams += `&status=${statusFilter}`;

      // Add sorting
      queryParams += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      // ใช้ any ชั่วคราวเพื่อหลีกเลี่ยงปัญหา TypeScript
      const result = await api.get<any>(`users/?${queryParams}`);

      if (result.code === 200 && result.status === 'OK') {
        // Access data correctly
        if (result.data) {
          setUsers(result.data.users || []);
          setTotalUsers(result.data.total || 0);
        } else {
          setUsers([]);
          setTotalUsers(0);
        }
      } else {
        if (result.data === null) {
          setUsers([]);
          setTotalUsers(0);
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  // เรียก API เพียงครั้งเดียวเมื่อมีการเปลี่ยนแปลงเงื่อนไข
  useEffect(() => {
    // เรียก roles เพียงครั้งแรก
    if (currentPage === 1 && !searchQuery && !roleFilter && !statusFilter && sortBy === 'name' && sortOrder === 'asc') {
      fetchRoles();
    }

    // เรียก users ทุกครั้งที่มีการเปลี่ยนแปลงเงื่อนไข
    fetchUsers();
  }, [currentPage, pageSize, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  const toggleUserStatus = async (user: User) => {
    try {
      await api.put(`status/user/${user.id}`, { status: !user.status, updatedBy: user.id });
      showNotification('success', language === 'en' ? 'Status updated successfully' : 'อัปเดตสถานะสำเร็จ');
      // Fetch fresh data without showing loading indicator
      fetchUsers(true);
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', language === 'en' ? 'Failed to update status' : 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / pageSize);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Handle delete user
  const handleDelete = async () => {
    if (!selectedUserId) return;

    try {
      // Use the correct endpoint with type assertion
      await api.delete(`users/${selectedUserId}`);
      showNotification('success', language === 'en' ? 'User deleted successfully' : 'ลบผู้ใช้สำเร็จ');
      fetchUsers(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', language === 'en' ? 'Failed to delete user' : 'ไม่สามารถลบผู้ใช้ได้');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 1000);
  };

  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  // Notification component
  const Notification = () => {
    if (!notification.visible) return null;

    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }[notification.type];

    return (
      <div className={`fixed top-4 right-4 p-4 rounded-md text-white ${bgColor} shadow-lg z-50 flex items-center justify-between`}>
        <span>{notification.message}</span>
        <button
          onClick={closeNotification}
          className="ml-4 cursor-pointer text-white hover:text-gray-200 focus:outline-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* Notification */}
      <Notification />

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={deleteDialogOpen}
        title={language === 'en' ? 'Delete User' : 'ลบผู้ใช้'}
        message={language === 'en' ? 'Are you sure you want to delete this user? This action cannot be undone.' : 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้'}
        confirmText={language === 'en' ? 'Delete' : 'ลบ'}
        cancelText={language === 'en' ? 'Cancel' : 'ยกเลิก'}
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedUserId(null);
        }}
      />

      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#0038A8]">{language === 'en' ? 'Manage Users' : 'จัดการผู้ใช้'}</h1>
            <p className="text-sm text-[#0038A8] mt-1">{language === 'en' ? 'All users in the system' : 'รายการผู้ใช้ทั้งหมดในระบบ'}</p>
          </div>
        </div>

        {/* Filters */}
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
                  placeholder={language === 'en' ? 'Search by name, email, or username' : 'ค้นหาด้วยชื่อ อีเมล หรือชื่อผู้ใช้'}
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                    <svg
                      onClick={() => setSearchQuery('')}
                      className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div className="w-full md:w-64">
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'en' ? 'Status' : 'สถานะ'}
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  className="block w-full pl-4 pr-10 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-lg appearance-none focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 hover:shadow-md focus:shadow-lg outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="">{language === 'en' ? 'All Status' : 'ทุกสถานะ'}</option>
                  <option value="true">{language === 'en' ? 'Active' : 'ใช้งาน'}</option>
                  <option value="false">{language === 'en' ? 'Inactive' : 'ไม่ใช้งาน'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-teal-600">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <svg className="animate-spin h-8 w-8 text-teal-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">{language === 'en' ? 'Loading users...' : 'กำลังโหลดข้อมูลผู้ใช้...'}</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{language === 'en' ? 'Error' : 'เกิดข้อผิดพลาด'}</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  onClick={() => fetchUsers(true)}
                >
                  {language === 'en' ? 'Try Again' : 'ลองอีกครั้ง'}
                </button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{language === 'en' ? 'No users found' : 'ไม่พบผู้ใช้'}</h3>
              <p className="mt-1 text-sm text-gray-500">{language === 'en' ? 'Try adjusting your search or filter to find what you\'re looking for.' : 'ลองปรับการค้นหาหรือตัวกรองเพื่อค้นหาสิ่งที่คุณกำลังมองหา'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('name')}
                    >
                      <div className="flex items-center">
                        <span>{language === 'en' ? 'Name' : 'ชื่อ'}</span>
                        {sortBy === 'name' && (
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('email')}
                    >
                      <div className="flex items-center">
                        <span>{language === 'en' ? 'Email/Phone' : 'อีเมล/โทรศัพท์'}</span>
                        {sortBy === 'email' && (
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {language === 'en' ? 'Role' : 'บทบาท'}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {language === 'en' ? 'Status' : 'สถานะ'}
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">{language === 'en' ? 'Actions' : 'การกระทำ'}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-800 font-medium text-lg">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`relative cursor-pointer inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${user.status ? 'bg-[var(--color-primary,#0038A8)]' : 'bg-gray-200'}`}
                          >
                            <span className="sr-only">{language === 'en' ? 'Toggle status' : 'สลับสถานะ'}</span>
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${user.status ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                          <span className="ml-2 text-sm">
                            {user.status ?
                              (language === 'en' ? 'Active' : 'ใช้งาน') :
                              (language === 'en' ? 'Inactive' : 'ไม่ใช้งาน')
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {user.role.name !== 'User' ? (
                            <Link
                              to={`/manageusers/${user.id}/edit`}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              {language === 'en' ? 'Edit' : 'แก้ไข'}
                            </Link>
                          ) : (
                            <span className="text-gray-400 px-2 py-1 cursor-not-allowed" title={language === 'en' ? 'User role cannot be edited' : 'บทบาท User ไม่สามารถแก้ไขได้'}>
                              {language === 'en' ? 'Edit' : 'แก้ไข'}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 cursor-pointer hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                          >
                            {language === 'en' ? 'Delete' : 'ลบ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalUsers > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {language === 'en' ?
                      `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalUsers)} of ${totalUsers} users` :
                      `แสดง ${(currentPage - 1) * pageSize + 1} ถึง ${Math.min(currentPage * pageSize, totalUsers)} จากทั้งหมด ${totalUsers} รายการ`
                    }
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative cursor-pointer inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">{language === 'en' ? 'Previous' : 'ก่อนหน้า'}</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(page)}
                          className={`relative cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page ? 'z-10 bg-teal-50 border-teal-500 text-teal-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>
                      ) : (
                        <span
                          key={index}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          {page}
                        </span>
                      )
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative cursor-pointer inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">{language === 'en' ? 'Next' : 'ถัดไป'}</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {language === 'en' ? 'Previous' : 'ก่อนหน้า'}
                </button>
                <div className="text-sm text-gray-700">
                  <span>{language === 'en' ? 'Page' : 'หน้า'} </span>
                  <span className="font-medium">{currentPage}</span>
                  <span> {language === 'en' ? 'of' : 'จาก'} </span>
                  <span className="font-medium">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {language === 'en' ? 'Next' : 'ถัดไป'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
