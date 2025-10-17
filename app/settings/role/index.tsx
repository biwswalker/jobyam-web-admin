import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useLanguage } from '../../components/DashboardLayout';

// Interface for Role data
import PermissionModal from './components/PermissionModal';
export interface Role {
  id: string;
  name: string;
  status: boolean;
  userCount: number;
}

// Notification component
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, isOpen, onClose }) => {
  const { language } = useLanguage();
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  const icon = {
    success: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${bgColor}`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="mr-3">{icon}</div>
          <div className="text-white font-medium">{message}</div>
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Modal component for add/edit role
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onSave: (role: Partial<Role>) => void;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, role, onSave, title }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    status: true
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        status: role.status
      });
    } else {
      setFormData({
        name: '',
        status: true
      });
    }
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl max-w-md w-[calc(100%-2rem)] sm:w-full mx-4 overflow-hidden"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'en' ? 'Role Name' : 'ชื่อบทบาท'}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Status' : 'สถานะ'}
                </label>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="status"
                    name="status"
                    checked={formData.status}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary,#0038A8)]"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.status ? (language === 'en' ? 'Enabled' : 'เปิดใช้งาน') : (language === 'en' ? 'Disabled' : 'ปิดใช้งาน')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 cursor-pointer flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {language === 'en' ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button
                type="submit"
                className="px-4 cursor-pointer py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {language === 'en' ? 'Save' : 'บันทึก'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Confirmation modal for delete
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { language } = useLanguage();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl max-w-md w-[calc(100%-2rem)] sm:w-full mx-4 overflow-hidden"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700">{message}</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 cursor-pointer bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {language === 'en' ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 cursor-pointer bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {language === 'en' ? 'Confirm' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export interface Permission {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export default function RoleManagement() {
  // ...
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  // เพิ่ม state สำหรับ permissions และ loading
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const handleManagePermission = async (role: Role) => {
    setPermissionsLoading(true);
    setSelectedRole(role);
    setPermissionModalOpen(true);
    try {
      const response = await api.get(`role/${role.id}/permissions`) as { code: number; status: string; data: Permission[] }; if (response.code === 200 && response.status === 'OK') {
        setPermissions(response.data);
      }
    } catch (error) {
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const { language } = useLanguage();
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tableKey, setTableKey] = useState(Date.now()); // Add a key to force re-render only when needed
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; isOpen: boolean }>({
    type: 'success',
    message: '',
    isOpen: false
  });

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, isOpen: true });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch roles without showing loading indicator for updates
  const fetchRoles = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      // Match the API response structure
      const response = await api.get<{ code: number; status: string; data: Role[] }>('role');

      // Check if response.data exists and has the data array
      if (response && response.data && Array.isArray(response.data)) {
        setRoles(response.data);
        setFilteredRoles(response.data);
      } else {
        console.error('Unexpected API response structure:', response);
        setRoles([]);
        setFilteredRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showNotification('error', language === 'en' ? 'Failed to load roles' : 'ไม่สามารถโหลดข้อมูลบทบาทได้');
      // Set empty arrays on error
      setRoles([]);
      setFilteredRoles([]);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(role =>
        role.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRoles(filtered);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Add new role
  const addRole = async (roleData: Partial<Role>) => {
    try {
      await api.post<{ data: Role }>('role', roleData);
      showNotification('success', language === 'en' ? 'Role added successfully' : 'เพิ่มบทบาทสำเร็จ');
      setModalOpen(false);
      // Fetch fresh data without showing loading indicator
      fetchRoles(false);
    } catch (error) {
      console.error('Error adding role:', error);
      showNotification('error', language === 'en' ? 'Failed to add role' : 'ไม่สามารถเพิ่มบทบาทได้');
    }
  };

  // Update role
  const updateRole = async (roleData: Partial<Role>) => {
    if (!currentRole) return;

    try {
      await api.put<{ data: Role }>(`role/${currentRole.id}`, roleData);
      showNotification('success', language === 'en' ? 'Role updated successfully' : 'อัปเดตบทบาทสำเร็จ');
      setModalOpen(false);
      // Fetch fresh data without showing loading indicator
      fetchRoles(false);
    } catch (error) {
      console.error('Error updating role:', error);
      showNotification('error', language === 'en' ? 'Failed to update role' : 'ไม่สามารถอัปเดตบทบาทได้');
    }
  };

  // Delete role
  const deleteRole = async () => {
    if (!deleteRoleId) return;

    try {
      await api.delete(`role/${deleteRoleId}`);
      showNotification('success', language === 'en' ? 'Role deleted successfully' : 'ลบบทบาทสำเร็จ');
      setConfirmModalOpen(false);
      // Fetch fresh data without showing loading indicator
      fetchRoles(false);
    } catch (error) {
      console.error('Error deleting role:', error);
      showNotification('error', language === 'en' ? 'Failed to delete role' : 'ไม่สามารถลบบทบาทได้');
    }
  };

  // Toggle role status
  const toggleRoleStatus = async (role: Role) => {
    try {
      await api.put(`status/role/${role.id}`, { status: !role.status });
      showNotification('success', language === 'en' ? 'Status updated successfully' : 'อัปเดตสถานะสำเร็จ');
      // Fetch fresh data without showing loading indicator
      fetchRoles(false);
    } catch (error) {
      console.error('Error toggling role status:', error);
      showNotification('error', language === 'en' ? 'Failed to update status' : 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  // Handle save (add or update)
  const handleSave = (roleData: Partial<Role>) => {
    if (currentRole) {
      updateRole(roleData);
    } else {
      addRole(roleData);
    }
  };

  // Open modal for add/edit
  const openModal = (role: Role | null = null) => {
    setCurrentRole(role);
    setModalOpen(true);
  };

  // Open confirm modal for delete
  const openConfirmModal = (roleId: string) => {
    setDeleteRoleId(roleId);
    setConfirmModalOpen(true);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8">
      {/* Notification component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={closeNotification}
      />

      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{language === 'en' ? 'Role Management' : 'จัดการบทบาท'}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">{language === 'en' ? 'Manage user roles in the system' : 'จัดการบทบาทผู้ใช้งานในระบบ'}</p>
        </motion.div>
      </div>

      {/* Action Bar */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="w-full sm:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder={language === 'en' ? 'Search roles...' : 'ค้นหาบทบาท...'}
              value={searchQuery}
              onChange={(e) => handleSearch(e)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto cursor-pointer px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center sm:justify-start shadow-sm text-sm sm:text-base"
          onClick={() => openModal()}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {language === 'en' ? 'Add New Role' : 'เพิ่มบทบาทใหม่'}
        </motion.button>
      </div>

      {/* Roles Table */}
      <div key={tableKey} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mt-4 sm:mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>{language === 'en' ? 'No roles found' : 'ไม่พบข้อมูลบทบาท'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Role' : 'บทบาท'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'User Count' : 'จำนวนผู้ใช้'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Status' : 'สถานะ'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Action' : 'จัดการ'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{role.userCount || 0} {language === 'en' ? 'Users' : 'คน'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {role.status ? (language === 'en' ? 'Enabled' : 'เปิดใช้งาน') : (language === 'en' ? 'Disabled' : 'ปิดใช้งาน')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <div className="flex items-center space-x-2" title={role.status ? (language === 'en' ? 'Disable' : 'ปิดใช้งาน') : (language === 'en' ? 'Enable' : 'เปิดใช้งาน')}>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={role.status}
                              onChange={() => toggleRoleStatus(role)}
                              className="sr-only peer"
                            />
                            <div
                              onClick={() => toggleRoleStatus(role)}
                              className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary,#0038A8)]"
                            ></div>
                          </div>
                        </div>
                        <button
                          onClick={() => openModal(role)}
                          className="p-1.5 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-md"
                          title={language === 'en' ? 'Edit' : 'แก้ไข'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleManagePermission(role)}
                          className="p-1.5 cursor-pointer text-teal-600 hover:bg-teal-50 rounded-md"
                          title={language === 'en' ? 'Manage Permission' : 'จัดการสิทธิ์'}
                        >
                          {/* ใช้ emoji เป็นไอคอน หรือเปลี่ยนเป็น SVG ได้ */}
                          <span role="img" aria-label="permission">🛡️</span>
                        </button>
                        <button
                          onClick={() => openConfirmModal(role.id)}
                          className="p-1.5 cursor-pointer text-red-600 hover:bg-red-50 rounded-md"
                          title={language === 'en' ? 'Delete' : 'ลบ'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Permission Modal */}
                {permissionModalOpen && selectedRole && (
                  <PermissionModal
                    role={selectedRole}
                    permissions={permissions}
                    setPermissions={setPermissions}
                    loading={permissionsLoading}
                    onClose={() => setPermissionModalOpen(false)}
                  />
                )}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <div className="text-xs sm:text-sm text-gray-700 w-full sm:w-auto text-center sm:text-left">
          {language === 'en' ? 'Showing ' : 'แสดง '}<span className="font-medium">{filteredRoles?.length || 0}</span>{language === 'en' ? ' of ' : ' จาก '}<span className="font-medium">{roles?.length || 0}</span>{language === 'en' ? ' items' : ' รายการ'}
        </div>
        <div className="flex space-x-2 w-full sm:w-auto justify-center sm:justify-start">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            {language === 'en' ? 'Previous' : 'ก่อนหน้า'}
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm bg-teal-50 text-teal-600 border-teal-500">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            {language === 'en' ? 'Next' : 'ถัดไป'}
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        role={currentRole}
        onSave={handleSave}
        title={currentRole ? (language === 'en' ? 'Edit Role' : 'แก้ไขบทบาท') : (language === 'en' ? 'Add New Role' : 'เพิ่มบทบาทใหม่')}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={deleteRole}
        title={language === 'en' ? 'Confirm Delete' : 'ยืนยันการลบ'}
        message={language === 'en' ? 'Are you sure you want to delete this role? This action cannot be undone.' : 'คุณต้องการลบบทบาทนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้'}
      />
    </div>
  );
}
