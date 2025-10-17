import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import CompanyEditModal from '../../components/CompanyEditModal';
import type { ApiResponse } from '../../services/api';
import type { Manpower } from '~/types';
import ManpowerEditModal from '~/components/ManpowerEditModal';

interface Company {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  status: boolean;
}

export type { Company };

// Interface for user data
interface Company {
  id: string;
  name: string;
  address: string;
  email: string;
  status: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

interface UserData {
  id: string;
  name: string;
  phone: string;
  user_name?: string;
  email?: string;
  address?: string;
  agentKey?: string;
  birthDay?: string;
  contactName?: string;
  contactNumber?: string;
  contact_name?: string;
  contact_number?: string;
  notifications?: any;
  relationship?: string;
  role?: {
    id?: string;
    name: string;
    [key: string]: any;
  };
  status?: boolean;
  profileImage?: string;
  companyID?: string; // Add companyID field
  manpowerID?: string; // Add manpowerID field
}

// Notification popup component
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
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

export default function ProfileSettings() {
  const { language, setLanguage } = useLanguage();

  // State for edited user data
  const [editedUserData, setEditedUserData] = useState<UserData>({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    birthDay: '',
    contactName: '',
    contactNumber: '',
    relationship: '',
    role: { name: '' }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  // Translation dictionary for this page
  const t = (key: string) => {
    const dict: Record<string, { th: string; en: string }> = {
      'profileTitle': { th: 'โปรไฟล์ผู้ใช้งาน', en: 'User Profile' },
      'profileDesc': { th: 'จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ', en: 'Manage your personal information and account settings' },
      'editProfile': { th: 'แก้ไขโปรไฟล์', en: 'Edit Profile' },
      'changePassword': { th: 'เปลี่ยนรหัสผ่าน', en: 'Change Password' },
      'cancel': { th: 'ยกเลิก', en: 'Cancel' },
      'save': { th: 'บันทึก', en: 'Save' },
      'personalInfo': { th: 'ข้อมูลส่วนตัว', en: 'Personal Information' },
      'contactInfo': { th: 'ข้อมูลการติดต่อและระบบ', en: 'Contact & System Info' },
      'phone': { th: 'เบอร์โทรศัพท์', en: 'Phone' },
      'birthday': { th: 'วันเกิด', en: 'Birthday' },
      'address': { th: 'ที่อยู่', en: 'Address' },
      'email': { th: 'อีเมล', en: 'Email' },
      'status': { th: 'สถานะ', en: 'Status' },
      'statusActive': { th: 'Active', en: 'Active' },
      'statusInactive': { th: 'Inactive', en: 'Inactive' },
      'role': { th: 'บทบาท', en: 'Role' },
      'emergencyContact': { th: 'ข้อมูลติดต่อฉุกเฉิน', en: 'Emergency Contact' },
      'contactName': { th: 'ชื่อผู้ติดต่อ', en: 'Contact Name' },
      'contactNumber': { th: 'เบอร์ติดต่อ', en: 'Contact Number' },
      'relationship': { th: 'ความสัมพันธ์', en: 'Relationship' },
      'currentPassword': { th: 'รหัสผ่านปัจจุบัน', en: 'Current Password' },
      'newPassword': { th: 'รหัสผ่านใหม่', en: 'New Password' },
      'confirmNewPassword': { th: 'ยืนยันรหัสผ่านใหม่', en: 'Confirm New Password' },
      'passwordNotMatch': { th: 'รหัสผ่านไม่ตรงกัน', en: 'Passwords do not match' },
      'changePasswordBtn': { th: 'เปลี่ยนรหัสผ่าน', en: 'Change Password' },
      'language': { th: 'ภาษา', en: 'Language' },
      'thai': { th: 'ไทย', en: 'Thai' },
      'english': { th: 'อังกฤษ', en: 'English' },
      'emergencyContactNumber': { th: 'เบอร์ติดต่อฉุกเฉิน', en: 'Emergency Contact Number' },
      'companyInfo': { th: 'ข้อมูลผู้ว่าจ้าง', en: 'Company Information' },
      'companyName': { th: 'ชื่อผู้ว่าจ้าง', en: 'Company Name' },
      'companyAddress': { th: 'ที่อยู่ผู้ว่าจ้าง', en: 'Company Address' },
      'companyEmail': { th: 'อีเมลผู้ว่าจ้าง', en: 'Company Email' },
      'companyStatus': { th: 'สถานะ', en: 'Status' },
      'companyCreatedAt': { th: 'สร้างเมื่อ', en: 'Created At' },
      'companyActive': { th: 'Active', en: 'Active' },
      'companyInactive': { th: 'Inactive', en: 'Inactive' },
      'companyNotAvailable': { th: 'ไม่พบข้อมูลผู้ว่าจ้าง', en: 'Company information not available' },
      'manpowerInfo': { th: 'ข้อมูลผู้ให้บริการแรงงาน', en: 'Manpower Information' },
      'manpowerName': { th: 'ชื่อผู้ให้บริการแรงงาน', en: 'Manpower Name' },
      'manpowerDetail': { th: 'รายละเอียด', en: 'Detail' },
      'contractNumber': { th: 'เลขที่สัญญา', en: 'Contract Number' },
      'certificate': { th: 'ใบรับรอง', en: 'Certificate' },
      'viewCertificate': { th: 'ดูใบรับรอง', en: 'View Certificate' },
      'edit': { th: 'แก้ไข', en: 'Edit' },
      'manpowerNotAvailable': { th: 'ไม่พบข้อมูลผู้ให้บริการแรงงาน', en: 'Manpower information not available' },
      'manpowerUpdatedSuccessfully': { th: 'อัปเดตข้อมูลผู้ให้บริการแรงงานสำเร็จ', en: 'Manpower information updated successfully' },
      'manpowerUpdateFailed': { th: 'อัปเดตข้อมูลผู้ให้บริการแรงงานไม่สำเร็จ', en: 'Failed to update manpower information' },
      'contactEmail': { th: 'อีเมล', en: 'Contact Email' },
    };
    return dict[key]?.[language] || key;
  };

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [manpower, setManpower] = useState<Manpower | null>(null);
  const [manpowerError, setManpowerError] = useState<string | null>(null);
  const [manpowerLoading, setManpowerLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ''
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; isOpen: boolean }>({
    type: 'success',
    message: '',
    isOpen: false
  });
  const navigate = useNavigate();



  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, isOpen: true });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Separate useEffect for user data
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('jobyamUserAdmin');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
        setEditedUserData(parsedData);
      } else {
        setError('No user data found. Please log in again.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setError('Error loading user data. Please log in again.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Separate useEffect for manpower data
  useEffect(() => {
    const fetchManpowerData = async () => {
      if (userData?.role?.name === 'manpower' && userData?.manpowerID) {
        setManpowerLoading(true);
        try {
          const response = await api.get<Manpower>(`jobmanpower/${userData.manpowerID}`);
          const manpowerData = response.data;
          if (manpowerData) {
            setManpower(manpowerData);
            setManpowerError('');
          } else {
            setManpower(null);
            setManpowerError('No manpower data found');
          }
        } catch (error) {
          console.error('Error fetching manpower data:', error);
          setManpowerError(t('manpowerNotAvailable'));
        } finally {
          setManpowerLoading(false);
        }
      } else {
        setManpower(null);
        setManpowerLoading(false);
      }
    };

    fetchManpowerData();
  }, [userData?.manpowerID, userData?.role?.name]);

  // Separate useEffect for company data
  useEffect(() => {
    if (userData?.role?.name === 'owner' && userData?.companyID) {
      setCompanyLoading(true);
      api.get<Company>(`jobs/companyById/${userData.companyID}`)
        .then(response => {
          setCompany(response.data);
          setCompanyError('');
        })
        .catch(error => {
          console.error('Error fetching company:', error);
          setCompanyError(t('companyNotAvailable'));
        })
        .finally(() => {
          setCompanyLoading(false);
        });
    } else {
      setCompany(null);
      setCompanyLoading(false);
    }
  }, [userData?.companyID, userData?.role?.name]); // Only watch companyID and role changes // Add api to dependencies to prevent infinite calls

  // Add updateCompany function
  const updateCompany = async (companyId: string, updatedData: Partial<Company>): Promise<ApiResponse<Company>> => {
    try {
      updatedData.status = true;
      updatedData.updatedBy = userData?.id;
      const response = await api.put<Company>(`jobs/company/${companyId}`, updatedData);
      setCompany(response.data);

      return {
        code: parseInt(response.status),
        status: 'OK',
        message: 'Company updated successfully',
        data: response.data
      };

    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  };

  const updateManpower = async (
    manpowerId: string,
    updatedData: Partial<Manpower>,
    certificateFile?: File | null
  ): Promise<ApiResponse<Manpower>> => {
    try {
      updatedData.status = true;
      updatedData.updatedBy = userData?.id;

      let payload: any;
      let headers: any = {};

      if (certificateFile) {
        // กรณีมีไฟล์ ใช้ FormData
        payload = new FormData();
        Object.entries(updatedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            payload.append(key, value as string | Blob);
          }
        });
        payload.append('certificate', certificateFile);
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // ไม่มีไฟล์ ส่ง JSON ตามเดิม
        payload = updatedData;
      }

      const response = await api.put<Manpower>(
        `jobmanpower/${manpowerId}`,
        payload,
        { headers }
      );
      setManpower(response.data);

      return {
        code: parseInt(response.status),
        status: 'OK',
        message: 'Manpower updated successfully',
        data: response.data
      };

    } catch (error) {
      console.error('Error updating manpower:', error);
      throw error;
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, message: '' });
      return;
    }

    let score = 0;
    let message = '';

    // Length check
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[a-z]/.test(password)) score += 1; // Has lowercase
    if (/[0-9]/.test(password)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special character

    // Determine message based on score
    if (score <= 2) {
      message = 'อ่อน';
    } else if (score <= 4) {
      message = 'ปานกลาง';
    } else {
      message = 'แข็งแรง';
    }

    setPasswordStrength({ score, message });
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value
    });

    // Calculate strength for new password
    if (name === 'new') {
      calculatePasswordStrength(value);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field]
    });
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    if (editedUserData) {
      try {
        // Show loading indicator
        setIsLoading(true);

        // Prepare the request payload
        const payload = {
          name: editedUserData.name,
          user_name: editedUserData.user_name || userData?.user_name,
          phone: editedUserData.phone,
          email: editedUserData.email,
          address: editedUserData.address,
          birthDay: editedUserData.birthDay,
          role_id: editedUserData.role?.id || userData?.role?.id,
          status: editedUserData.status,
          contact_name: editedUserData.contact_name || editedUserData.contactName,
          contact_number: editedUserData.contact_number || editedUserData.contactNumber,
          relationship: editedUserData.relationship
        };

        // Make API call to update profile using API service
        try {
          const response = await api.put<UserData>(`users/update/admin/${editedUserData.id}`, payload);

          // Update local storage with new data
          localStorage.setItem('jobyamUserAdmin', JSON.stringify(response.data));
          setUserData(response.data);
          setIsEditMode(false);
        } catch (error) {
          throw new Error('Failed to update profile');
        }

        // Show success notification
        showNotification('success', 'บันทึกข้อมูลสำเร็จ');
      } catch (error) {
        console.error('Error updating profile:', error);

        // Show error notification
        showNotification('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Change password
  const changePassword = async () => {
    // Validate passwords
    if (passwords.new !== passwords.confirm) {
      showNotification('error', 'รหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (passwords.new.length < 6) {
      showNotification('warning', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (!userData) {
      showNotification('error', 'ไม่พบข้อมูลผู้ใช้');
      return;
    }

    try {
      // Show loading indicator
      setIsLoading(true);

      // Prepare the request payload for password change
      const payload = {
        oldPassword: passwords.current,
        newPassword: passwords.new
      };

      // Make API call to dedicated password change endpoint using API service
      try {
        await api.put(`users/changepassword/${userData.id}`, payload);
      } catch (error) {
        throw new Error('Failed to update password');
      }

      // Reset password fields and exit password mode
      setPasswords({ current: '', new: '', confirm: '' });
      setIsPasswordMode(false);

      // Show success notification
      showNotification('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (error) {
      console.error('Error updating password:', error);

      // Show error notification
      showNotification('error', 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Notification component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={closeNotification}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-primary,#0038A8)]">{t('profileTitle')}</h1>
          <button
            className="px-3 py-1 rounded-full border border-[var(--color-primary,#0038A8)] text-[var(--color-primary,#0038A8)] bg-white hover:bg-gray-100 text-xs font-semibold transition"
            onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
            aria-label="toggle-language"
          >
            {language === 'th' ? t('english') : t('thai')}
          </button>
        </div>
        <p className="text-gray-600 mt-1">{t('profileDesc')}</p>
      </motion.div>

      {userData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {!isEditMode && !isPasswordMode && (
            <div className="flex flex-col gap-8">
              {/* Profile Header Card */}
              <div className="bg-[var(--color-primary,#0038A8)] rounded-xl shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row items-center p-6">
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-[var(--color-primary,#0038A8)] text-4xl shadow-lg overflow-hidden border-4 border-white">
                      {userData.profileImage ? (
                        <img
                          src={userData.profileImage}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-bold">{typeof userData.name === 'string' ? userData.name.charAt(0).toUpperCase() : '?'}</span>
                      )}
                    </div>
                    <motion.div
                      className={`absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md ${!userData.status ? 'bg-green-500' : 'bg-red-500'}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center">
                        {!userData.status ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>

                  <div className="md:ml-8 text-center md:text-left mt-4 md:mt-0 text-white">
                    <motion.h2
                      className="text-3xl font-bold"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {typeof userData.name === 'string' ? userData.name : 'User'}
                    </motion.h2>

                    <motion.div
                      className="flex flex-col md:flex-row items-center md:items-start gap-2 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {userData.role && (
                        <span className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
                          {userData.role.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-white/90">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {userData.phone}
                      </span>
                    </motion.div>
                  </div>

                  <div className="md:ml-auto mt-6 md:mt-0 flex gap-2">
                    <motion.button
                      className="px-4 py-2 cursor-pointer bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditMode(true)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('editProfile')}
                    </motion.button>

                    <motion.button
                      className="px-4 py-2 cursor-pointer bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsPasswordMode(true)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {t('changePassword')}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <motion.div
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-[var(--color-primary,#0038A8)] flex items-center gap-2">
                      <svg className="w-5 h-5 text-[var(--color-primary,#0038A8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('personalInfo')}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('name')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{typeof userData.name === 'string' ? userData.name : JSON.stringify(userData.name)}</div>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('phone')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.phone}</div>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('email')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.email || '-'}</div>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('birthDay')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">
                        {userData.birthDay ? new Date(userData.birthDay).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('address')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.address || '-'}</div>
                    </div>
                    {userData.role?.name?.toLowerCase() === 'agent' && (
                      <div className="flex items-center">
                        <div className="w-1/3 text-sm font-medium text-gray-500">{t('agentKey')}</div>
                        <div className="w-2/3 flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{userData.agentKey || '-'}</span>
                          {userData.agentKey && (
                            <button
                              type="button"
                              className="ml-2 px-2 cursor-pointer py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                              onClick={() => {
                                navigator.clipboard.writeText(userData.agentKey || '');
                              }}
                              title={t('copy') || 'Copy'}
                            >
                              <svg className="inline w-4 h-4 mr-1 align-middle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              {t('copy') || 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Contact & System Information Card */}
                <motion.div
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-[var(--color-primary,#0038A8)] flex items-center gap-2">
                      <svg className="w-5 h-5 text-[var(--color-primary,#0038A8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {t('contactInfo')}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('role')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.role?.name || '-'}</div>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('emergencyContact')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.contactName || userData.contact_name || '-'}</div>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('emergencyContactNumber')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.contactNumber || userData.contact_number || '-'}</div>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('relationship')}</div>
                      <div className="w-2/3 text-sm font-medium text-gray-900">{userData.relationship || '-'}</div>
                    </div>
                    <div className="flex">
                      <div className="w-1/3 text-sm font-medium text-gray-500">{t('status')}</div>
                      <div className="w-2/3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${userData.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {userData.status ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Company Information Section for Owner */}
                {userData?.role?.name === 'owner' && (
                  <motion.div
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[var(--color-primary,#0038A8)] flex items-center gap-2">
                          <svg className="w-5 h-5 text-[var(--color-primary,#0038A8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 01-1-1h-2a1 1 0 01-1-1v-5m-4 0h4" />
                          </svg>
                          {t('companyInfo')}
                        </h3>
                      </div>
                      <div className="flex">
                        <button
                          type="button"
                          className="px-4 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          {t('edit')}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {companyLoading ? (
                        <div className="animate-pulse">
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('companyName')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('address')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contactEmail')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contactPhone')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('status')}</div>
                            <div className="w-2/3">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      ) : companyError ? (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{typeof companyError === 'string' ? companyError : 'Error loading company data'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('companyName')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{company?.name || '-'}</div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('address')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{company?.address || '-'}</div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contactEmail')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{company?.email || '-'}</div>
                          </div>
                          <div className="flex">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('status')}</div>
                            <div className="w-2/3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${company?.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {company?.status ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Manpower Information Section for Manpower */}
                {userData?.role?.name === 'manpower' && (
                  <motion.div
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[var(--color-primary,#0038A8)] flex items-center gap-2">
                          <svg className="w-5 h-5 text-[var(--color-primary,#0038A8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 01-1-1h-2a1 1 0 01-1-1v-5m-4 0h4" />
                          </svg>
                          {t('manpowerInfo')}
                        </h3>
                      </div>
                      <div className="flex">
                        <button
                          type="button"
                          className="px-4 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          {t('edit')}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {manpowerLoading ? (
                        <div className="animate-pulse">
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('manpowerName')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('address')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contactEmail')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contactPhone')}</div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('status')}</div>
                            <div className="w-2/3">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      ) : manpowerError ? (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{typeof companyError === 'string' ? companyError : 'Error loading company data'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('manpowerName')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.name || '-'}</div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contract')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.contract || '-'}</div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('contractNumber')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.contractNumber || '-'}</div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('detail')}</div>
                            <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.detail || '-'}</div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('certificate')}</div>
                            <div className="w-2/3">
                              {manpower?.certificate ? (
                                <a
                                  href={`${import.meta.env.VITE_API_URL_MEDIA}${manpower.certificate}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors shadow-sm max-w-full"
                                  title="เปิด/ดาวน์โหลดใบรับรอง"
                                  style={{ wordBreak: 'break-all' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    <rect x="4" y="4" width="16" height="16" rx="2" fill="#fff" stroke="#e53e3e" />
                                    <text x="8" y="16" fill="#e53e3e" fontSize="8" fontWeight="bold">PDF</text>
                                  </svg>
                                  <span className="truncate">{manpower.certificate.split('/').pop()}</span>
                                </a>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">-</span>
                              )}
                            </div>
                          </div>
                          <div className="flex border-b border-gray-100 pb-3">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('location')}</div>
                            <div className="w-2/3">
                              {manpower?.location ? (
                                <a
                                  href={manpower.location}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                                >
                                  {manpower.location}
                                </a>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">-</span>
                              )}
                            </div>
                          </div>
                          <div className="flex">
                            <div className="w-1/3 text-sm font-medium text-gray-500">{t('status')}</div>
                            <div className="w-2/3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${manpower?.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {manpower?.status ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <CompanyEditModal
                company={company}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={async (updatedCompany: Partial<Company>) => {
                  if (company?.id) {
                    try {
                      const response = await updateCompany(company.id, updatedCompany);
                      if (response.code === 200) {
                        setCompany(response.data);
                        setNotification({
                          type: 'success',
                          message: t('companyUpdatedSuccessfully'),
                          isOpen: true
                        });
                      }
                    } catch (error) {
                      setNotification({
                        type: 'error',
                        message: t('errorUpdatingCompany'),
                        isOpen: true
                      });
                    }
                  }
                }}
              />

              {/* Company Edit Modal */}
              <ManpowerEditModal
                manpower={manpower}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={async (manpowerId: string, updatedData: Partial<Manpower>) => {
                  if (!manpower?.id) {
                    throw new Error('Manpower ID is required');
                  }
                  try {
                    const response = await updateManpower(manpowerId, updatedData);
                    if (response.code === 200) {
                      setManpower(response.data);
                      setNotification({
                        type: 'success',
                        message: t('manpowerUpdatedSuccessfully'),
                        isOpen: true
                      });
                    }
                    return response;
                  } catch (error) {
                    setNotification({
                      type: 'error',
                      message: t('manpowerUpdateFailed'),
                      isOpen: true
                    });
                    throw error;
                  }
                }}
              />

              {/* Logout Button */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  className="px-5 py-2.5 cursor-pointer bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    localStorage.removeItem('jobyamUserAdmin');
                    navigate('/login');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('logout')}
                </motion.button>
              </motion.div>
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditMode && editedUserData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 p-6 rounded-lg shadow-inner mt-6"
            >
              <h3 className="text-xl font-semibold text-teal-800 mb-4">แก้ไขข้อมูลส่วนตัว</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                  <input
                    type="text"
                    name="name"
                    value={editedUserData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    name="phone"
                    value={editedUserData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={editedUserData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">วันเกิด</label>
                  <input
                    type="date"
                    name="birthDay"
                    value={editedUserData.birthDay ? new Date(editedUserData.birthDay).toISOString().split('T')[0] : ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ชื่อผู้ติดต่อฉุกเฉิน</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={editedUserData.contactName || editedUserData.contact_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">เบอร์ผู้ติดต่อฉุกเฉิน</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={editedUserData.contactNumber || editedUserData.contact_number || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ความสัมพันธ์กับผู้ติดต่อฉุกเฉิน</label>
                  <input
                    type="text"
                    name="relationship"
                    value={editedUserData.relationship || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                  <textarea
                    name="address"
                    value={editedUserData.address || ''}
                    onChange={(e) => {
                      if (editedUserData) {
                        setEditedUserData({
                          ...editedUserData,
                          address: e.target.value
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={saveProfileChanges}
                  className="px-4 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedUserData(userData); // Reset to original data
                  }}
                  className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          )}

          {/* Change Password Form */}
          {isPasswordMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 p-6 rounded-lg shadow-inner mt-6"
            >
              <h3 className="text-xl font-semibold text-teal-800 mb-4">เปลี่ยนรหัสผ่าน</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
                  <div className="relative">
                    <input
                      type={passwordVisibility.current ? "text" : "password"}
                      name="current"
                      value={passwords.current}
                      onChange={handlePasswordChange}
                      placeholder="กรุณากรอกรหัสผ่านปัจจุบัน"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {passwordVisibility.current ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                  <div className="relative">
                    <input
                      type={passwordVisibility.new ? "text" : "password"}
                      name="new"
                      value={passwords.new}
                      onChange={handlePasswordChange}
                      placeholder="กรุณากรอกรหัสผ่านใหม่"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {passwordVisibility.new ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {passwords.new && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700">ความแข็งแรงของรหัสผ่าน:</p>
                        <span className={`text-xs font-medium ${passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {passwordStrength.message}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${passwordStrength.score <= 2 ? 'bg-red-500' : passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (passwordStrength.score / 6) * 100)}%` }}
                        ></div>
                      </div>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc pl-5">
                        <li className={passwords.new.length >= 6 ? 'text-green-500' : 'text-gray-500'}>มีความยาวอย่างน้อย 6 ตัวอักษร</li>
                        <li className={/[A-Z]/.test(passwords.new) ? 'text-green-500' : 'text-gray-500'}>มีตัวอักษรตัวพิมพ์ใหญ่ (A-Z)</li>
                        <li className={/[0-9]/.test(passwords.new) ? 'text-green-500' : 'text-gray-500'}>มีตัวเลข (0-9)</li>
                        <li className={/[^A-Za-z0-9]/.test(passwords.new) ? 'text-green-500' : 'text-gray-500'}>มีอักขระพิเศษ (!@#$%^&*)</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                  <div className="relative">
                    <input
                      type={passwordVisibility.confirm ? "text" : "password"}
                      name="confirm"
                      value={passwords.confirm}
                      onChange={handlePasswordChange}
                      placeholder="กรุณายืนยันรหัสผ่านใหม่"
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${passwords.new && passwords.confirm && passwords.new !== passwords.confirm ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {passwordVisibility.confirm ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                    <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={changePassword}
                  className="px-4 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
                >
                  {t('changePasswordBtn')}
                </button>
                <button
                  onClick={() => {
                    setIsPasswordMode(false);
                    setPasswords({ current: '', new: '', confirm: '' });
                  }}
                  className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
