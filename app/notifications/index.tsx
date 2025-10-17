import React, { useEffect, useState, useMemo, useRef } from 'react';
import { t } from '../locales';
import { useLanguage } from '~/components/DashboardLayout';
import { getAdminNotifications, markNotificationAsRead } from '../services/notificationsService';
import type { Notification } from '../services/notificationsService';
import { FaEye } from '@react-icons/all-files/fa/FaEye';
import { FaPaperPlane } from '@react-icons/all-files/fa/FaPaperPlane';
import { useNavigate } from 'react-router';
import type { Applicant, JobApplication } from '~/services/applicants';
import {
  getApplicantJobs,
  getApplicantsByRole,
  getUsersSelect,
} from "../services/applicants";
import type { ApiResponse } from '~/services/api';
import { getUsers, sendCustomNotification } from '../services/userService';
import type { User } from '../services/userService';
import type { UsersResponse } from '../services/userService';
import Select from 'react-select';

interface UserAdmin {
  id: string;
  companyID: string;
  manpowerID: string;
  role: { name: string };
}


const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'user_name', label: 'User Name' },
  { value: 'created_at', label: 'Date' },
];


interface selectUser {
  id: string,
  name: string,
  role: string,
  agentey: string
}

const Notifications = (): React.ReactNode => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'job_title' | 'user_name' | 'created_at'>('all');
  const [readStatus, setReadStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const effectRan = useRef(false);

  // Clear filter handler
  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterBy('all');
    setReadStatus('all');
    setDateFrom('');
    setDateTo('');
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'created_at' | 'job_title' | 'user_name' | 'title' | 'is_read' | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Notification | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState<boolean | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const response = await getUsers('user', 10000, 0, 'name', 'asc');

      if (response.code === 200) {
        // Check if response.data exists and what type it is
        if (response.data) {
          // Log all keys in the response.data object
          if (typeof response.data === 'object' && response.data !== null) {
            console.log('Response data keys:', Object.keys(response.data));
          }

          // Handle the specific structure where users are in the 'users' property
          if (Array.isArray(response.data)) {
            setUsers(response.data);
          } else if (typeof response.data === 'object' && response.data !== null) {
            // Cast to the correct type
            const usersResponse = response.data as UsersResponse;

            if (usersResponse.users && Array.isArray(usersResponse.users)) {
              // The API returns { users: [...] } structure
              setUsers(usersResponse.users);
            } else {
              // If we don't find the expected structure, log an error and set empty array
              setUsers([]);
            }
          }
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    }
  };

  const handleSendCustomNotification = async () => {
    if (!selectedUser || !customTitle || !customMessage) {
      return;
    }

    setSendingNotification(true);
    setNotificationSuccess(null);

    try {
      const response = await sendCustomNotification(selectedUser, customTitle, customMessage);
      if (response.code === 201) {
        setNotificationSuccess(true);
        // Reset form after successful submission
        setTimeout(() => {
          setSelectedUser('');
          setCustomTitle('');
          setCustomMessage('');
          setCustomModalOpen(false);
          setNotificationSuccess(null);
        }, 1500);
      } else {
        setNotificationSuccess(false);
      }
    } catch (error) {
      setNotificationSuccess(false);
    } finally {
      setSendingNotification(false);
    }
  };

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const local = localStorage.getItem('jobyamUserAdmin');
        if (!local) throw new Error('ไม่พบข้อมูลผู้ใช้');
        const user: UserAdmin = JSON.parse(local);
        let query = '';
        let role = user.role?.name?.toLowerCase();
        if (role === 'staff') {
          query = `role=${user.role?.name}&user_id=${user.id}`;
        } else if (role === 'owner') {
          query = `role=${user.role?.name}&company_id=${user.companyID}`;
        } else if (role === 'manpower') {
          query = `role=${user.role?.name}&job_manpower_id=${user.manpowerID}`;
        } else {
          query = `role=${user.role?.name}`;
        }
        const data = await getAdminNotifications(query);
        if (data.code !== 200) throw new Error(data.status || t('errorInternal', language));
        setNotifications(data.data || []);


        const response: ApiResponse<User[]> = await getUsersSelect();
        const users = response.data.filter((user: User) => {
          return user.role?.name?.toLowerCase() === 'user'
        });
        sessionStorage.setItem('users', JSON.stringify(users));
        setUsers(users || []);
      } catch (e: any) {
        setError(e.message || t('errorInternal', language));
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Search & sort
  const filteredNotifications = useMemo(() => {
    let items = notifications;
    // Filter by readStatus
    if (readStatus !== 'all') {
      items = items.filter(n => (readStatus === 'read' ? n.is_read : !n.is_read));
    }
    // Filter by date
    if (dateFrom) {
      items = items.filter(n => new Date(n.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      items = items.filter(n => new Date(n.created_at) <= new Date(dateTo));
    }
    // Search
    if (searchTerm.trim() !== '') {
      if (filterBy === 'all') {
        items = items.filter(n => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (n.user_name?.toLowerCase() || '').includes(searchLower) ||
            (n.job_title?.toLowerCase() || '').includes(searchLower) ||
            (n.title?.toLowerCase() || '').includes(searchLower) ||
            (n.message?.toLowerCase() || '').includes(searchLower)
          );
        });
      } else {
        items = items.filter(n =>
          (n[filterBy]?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
      }
    }
    if (sortKey) {
      items = items.slice().sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [notifications, searchTerm, filterBy, sortKey, sortAsc, readStatus, dateFrom, dateTo]);

  // Paging
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

  const handleSort = (key: 'created_at' | 'job_title' | 'user_name' | 'title' | 'is_read') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  async function gotoJobStatus(id: string, mapUserJobId: string) {
    const applicantData = applicants.find((job: Applicant) => job.id === id);
    if (applicantData) {
      sessionStorage.setItem('applicantsById', JSON.stringify(applicantData));
    }

    const jobsResp: ApiResponse<JobApplication[]> = await getApplicantJobs(id);
    const jobData = jobsResp.data.find((job: JobApplication) => job.mapUserJobId === mapUserJobId);
    sessionStorage.setItem('selectedJob', JSON.stringify(jobData));

    // Navigate to job status page
    navigate(`/applicants/status`);
    setModalOpen(false);
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">{t('notifications', language)}</h1>
      <div className="w-full mb-4">
        <button
          onClick={() => {
            setCustomModalOpen(true);
            // Fetch users if not already loaded
            if (users.length === 0) {
              fetchUsers();
            }
          }}
          className="flex cursor-pointer items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
        >
          <FaPaperPlane className="text-white" />
          {t('custom_message', language) || 'ส่งข้อความแบบกำหนดเอง'}
        </button>
      </div>
      <div className="w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          {/* Search input */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-gray-600 text-xs font-semibold mb-1 flex items-center gap-1">
              <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span className="text-sm">{t('search', language)}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="border border-gray-200 rounded-lg px-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-200 transition"
                placeholder={t('search_placeholder', language)}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </span>
            </div>
          </div>
          {/* Read Status */}
          <div className="min-w-[150px]">
            <label className="text-gray-600 text-xs font-semibold mb-1 flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm">{t('read_status', language)}</span>
            </label>
            <div className="relative">
              <select
                className="border border-gray-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none transition bg-white pr-8"
                value={readStatus}
                onChange={e => setReadStatus(e.target.value as any)}
              >
                <option value="all">{t('all', language)}</option>
                <option value="read">{t('read', language)}</option>
                <option value="unread">{t('unread', language)}</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </div>
          </div>
          {/* Date From */}
          <div className="min-w-[150px]">
            <label className="text-gray-600 text-xs font-semibold mb-1 flex items-center gap-1">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span className="text-sm">{t('date_from', language)}</span>
            </label>
            <div className="relative">
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
          </div>
          {/* Date To */}
          <div className="min-w-[150px]">
            <label className="text-gray-600 text-xs font-semibold mb-1 flex items-center gap-1">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span className="text-sm">{t('date_to', language)}</span>
            </label>
            <div className="relative">
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {/* Clear Filter Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilter}
              className="flex cursor-pointer justify-center items-center gap-2 bg-gray-100 hover:bg-teal-100 text-gray-700 hover:text-teal-700 border border-gray-200 rounded-lg px-4 py-2 transition font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              style={{ minHeight: '40px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
              {t('clear_filter', language) ?? 'ล้างตัวกรอง'}
            </button>
          </div>
          {/* Loading & Error */}
          {loading && <span className="text-gray-400 text-sm flex items-center gap-1"><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeDasharray="40" /></svg>{t('loading', language)}</span>}
          {error && <span className="text-red-500 text-sm flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>{error}</span>}
        </div>
      </div>

      {/* Notifications Table */}
      <div className="w-full mb-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-teal-700 uppercase tracking-wider whitespace-nowrap">{t('no', language)}</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  {t('date', language)} {sortKey === 'created_at' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('job_title')}
                >
                  {t('job_title', language)} {sortKey === 'job_title' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('user_name')}
                >
                  {t('name', language)} {sortKey === 'user_name' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  {t('notification_title', language)} {sortKey === 'title' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('is_read')}
                >{t('read', language)} {sortKey === 'is_read' && (sortAsc ? '▲' : '▼')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', language)}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-lg font-semibold">
                    {t('noData', language) || 'ไม่มีข้อมูล'}
                  </td>
                </tr>
              ) : currentItems.map((notification, index) => (
                <tr
                  key={notification.id}
                  className={`hover:bg-gray-50 transition-all duration-200 ${!notification.is_read ? 'bg-red-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.job_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {notification.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${notification.is_read ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {notification.is_read ? t('read', language) : t('unread', language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      className="ml-2 p-1 cursor-pointer rounded-full hover:bg-blue-100 text-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      title={t('read', language)}
                      onClick={async () => {
                        if (!notification.is_read) {
                          await markNotificationAsRead(notification.id);
                          setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                        }
                        setModalData(notification);
                        setModalOpen(true);
                      }}
                    >
                      <FaEye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8} className="px-6 py-2">
                  {totalPages > 1 && (
                    <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm text-gray-500">{t('total_count', language)}
                        <span className="font-bold text-blue-700"> {filteredNotifications.length} </span>
                        {t('list', language)}
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-gray-600 text-xs font-semibold">{t('page_size', language)}</span>
                          <select
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                            value={itemsPerPage}
                            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          >
                            {[10, 20, 50].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                          <span className="text-gray-600 text-xs font-semibold">/ {t('page', language)}</span>
                        </div>
                      </span>
                      <span className="text-sm text-gray-500">{t('page', language)} <span className="font-bold text-blue-700">{currentPage}</span> {t('from', language)} <span className="font-bold text-blue-700">{totalPages}</span></span>
                      <div className="flex">
                        <nav className="inline-flex rounded-md shadow">
                          <button
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {t('previous', language)}
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={i}
                                onClick={() => paginate(pageNumber)}
                                className={`px-3 py-1 border border-gray-300 text-sm font-medium ${currentPage === pageNumber
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-white text-gray-500 hover:bg-gray-50'
                                  }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {t('next', language)}
                          </button>
                        </nav>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal for notification details */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred background */}
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/50 transition-opacity duration-300"
            onClick={() => setModalOpen(false)}
          />

          {/* Envelope Container */}
          <div className="relative w-full max-w-2xl mx-4 animate-envelopeOpen">
            {/* Envelope Shape */}
            <div className="relative z-10">
              {/* Flap */}
              <div
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-16 bg-gradient-to-b from-blue-300 to-blue-100 rounded-t-2xl shadow-md animate-envelopeFlap"
                style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
              />

              {/* Envelope Body */}
              <div className="bg-white rounded-xl border-4 border-teal-200 shadow-2xl overflow-hidden pt-12 pb-6 px-12 relative">

                {/* Close Button */}
                <button
                  className="absolute cursor-pointer top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>

                {/* Header Icon + Title */}
                <div className="text-center mb-6 animate-fadeIn">
                  <div className="flex justify-center items-center mb-2">
                    <span className="bg-gradient-to-br from-teal-300 via-blue-200 to-amber-100 rounded-full p-5 shadow-lg border-2 border-blue-200 animate-bounceIn">
                      <FaEye size={40} className="text-blue-500 drop-shadow" />
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-700 to-amber-600 tracking-wide drop-shadow">
                    {modalData.job_title}
                  </h2>
                </div>

                {/* Email-like Content */}
                <div className="space-y-4 text-gray-800 text-[15px] leading-relaxed animate-fadeIn">

                  {/* Name + Subject in one row */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center justify-start text-left">
                      <span className="font-semibold text-teal-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                        {t('from', language)}:
                      </span>
                      <span className="text-teal-700 font-semibold">{modalData.user_name}</span>
                    </div>
                    <div className="flex flex-row gap-2 items-center justify-start text-left">
                      <span className="font-semibold text-blue-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="8" rx="2" /></svg>
                        {t('notification_title', language)}:
                      </span>
                      <span className="text-blue-800 font-semibold">{modalData.title}</span>
                    </div>
                  </div>
                  {/* Message */}
                  <div>
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 8h10v4H5z" /></svg>
                      {t('message', language)}:
                    </span>
                    <div className="mt-2 bg-gradient-to-br from-yellow-50 via-blue-50 to-teal-50 border-2 border-amber-200 rounded-xl px-6 py-4 text-gray-800 whitespace-pre-line shadow-inner">
                      {modalData.message}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200"
                      onClick={() => gotoJobStatus(modalData?.user_id, modalData?.map_user_jobs)}
                    >
                      {t('view_details', language)}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Envelope Shadow */}
            <div className="absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-blue-200 to-transparent rounded-b-2xl blur-sm opacity-40 z-0" />
          </div>

          {/* Animation Styles */}
          <style>{`
        @keyframes envelopeOpen { from { transform: scale(0.9) translateY(40px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-envelopeOpen { animation: envelopeOpen 0.5s cubic-bezier(.68,-0.55,.27,1.55) both; }
    
        @keyframes envelopeFlap { from { transform: scaleY(0.3); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        .animate-envelopeFlap { animation: envelopeFlap 0.6s 0.1s cubic-bezier(.68,-0.55,.27,1.55) both; }
    
        @keyframes bounceIn { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
        .animate-bounceIn { animation: bounceIn 0.7s 0.2s cubic-bezier(.68,-0.55,.27,1.55) both; }
    
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s both; }`}</style>
        </div>
      )}

      {/* Modal for custom notification */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred background */}
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/50 transition-opacity duration-300"
            onClick={() => setCustomModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md mx-4 animate-fadeIn">
            <div className="bg-white rounded-xl border-4 border-teal-200 shadow-2xl overflow-hidden py-6 px-8 relative">
              {/* Close Button */}
              <button
                className="absolute cursor-pointer top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                onClick={() => setCustomModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center items-center mb-2">
                  <span className="bg-gradient-to-br from-teal-300 via-blue-200 to-amber-100 rounded-full p-5 shadow-lg border-2 border-blue-200">
                    <FaPaperPlane size={30} className="text-blue-500 drop-shadow" />
                  </span>
                </div>
                <h2 className="text-1xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-700 to-amber-600 tracking-wide drop-shadow">
                  {t('notifications', language)}: {t('custom_message', language) || 'ข้อความแบบกำหนดเอง'}
                </h2>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('select_recipient', language) || 'เลือกผู้รับ'}
                  </label>
                  <Select
                    isDisabled={sendingNotification}
                    placeholder={t('select_user', language) || 'เลือกผู้ใช้'}
                    noOptionsMessage={() => t('no_users_found', language) || 'ไม่พบผู้ใช้'}
                    options={Array.isArray(users) ? users.map(user => ({
                      value: user.id,
                      label: user.name,
                      phone: user.phone
                    })) : []}
                    value={Array.isArray(users) ? users
                      .filter(user => user.id === selectedUser)
                      .map(user => ({
                        value: user.id,
                        label: user.name,
                        phone: user.phone
                      }))[0] : null}
                    onChange={(option: any) => setSelectedUser(option ? option.value : '')}
                    formatOptionLabel={(option: any) => (
                      <div>
                        <div className="font-medium">{option.label}</div>
                        {option.phone && <div className="text-sm text-gray-500">{option.phone}</div>}
                      </div>
                    )}
                    styles={{
                      control: (baseStyles, state) => ({
                        ...baseStyles,
                        borderColor: state.isFocused ? '#14b8a6' : '#e5e7eb',
                        boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                        '&:hover': {
                          borderColor: state.isFocused ? '#14b8a6' : '#d1d5db'
                        },
                        borderRadius: '0.5rem',
                        padding: '2px'
                      }),
                      option: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: state.isSelected ? '#e6fffa' : state.isFocused ? '#f3f4f6' : 'white',
                        color: '#111827',
                        borderLeft: state.isSelected ? '4px solid #14b8a6' : '4px solid transparent',
                        '&:active': {
                          backgroundColor: '#e6fffa'
                        }
                      }),
                      menu: (baseStyles) => ({
                        ...baseStyles,
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }),
                      input: (baseStyles) => ({
                        ...baseStyles,
                        color: '#111827'
                      })
                    }}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('title_notification', language) || 'หัวข้อ'}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={t('enter_title', language) || 'กรอกหัวข้อ'}
                    disabled={sendingNotification}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('message', language) || 'ข้อความ'}
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[120px]"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={t('enter_message', language) || 'กรอกข้อความ'}
                    disabled={sendingNotification}
                  />
                </div>

                {/* Status Message */}
                {notificationSuccess !== null && (
                  <div className={`text-center py-2 rounded-lg ${notificationSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {notificationSuccess
                      ? (t('notification_sent', language) || 'ส่งการแจ้งเตือนสำเร็จ')
                      : (t('notification_failed', language) || 'ไม่สามารถส่งการแจ้งเตือนได้')}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end mt-4">
                  <button
                    className={`flex cursor-pointer items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 ${sendingNotification ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-105'}`}
                    onClick={handleSendCustomNotification}
                    disabled={sendingNotification || !selectedUser || !customTitle || !customMessage}
                  >
                    {sendingNotification ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('sending', language) || 'กำลังส่ง...'}
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="text-white" />
                        {t('send', language) || 'ส่ง'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
