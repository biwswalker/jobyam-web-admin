import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../components/DashboardLayout';

interface User {
  id?: string;
  username?: string;
  userName?: string;
  name?: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  birthDay?: string;
  roleId?: string;
  role?: {
    id: string;
    name: string;
  };
  roleName?: string;
  status: boolean;
  contactName?: string;
  contactNumber?: string;
  relationship?: string;
}

interface Role {
  id: string;
  name: string;
  status: boolean;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export function meta() {
  return [
    { title: "Edit User - JobYam Admin" },
    { name: "description", content: "Edit user details" },
  ];
}

export default function EditUserPage() {
  // Show/hide password and confirm password state
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    userName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: '',
    birthDay: '',
    roleId: '',
    status: true,
    contactName: '',
    contactNumber: '',
    relationship: '',
    companyId: '', // For owner role
    manpowerId: '', // For manpower role
    agentKey: '' // For agent role
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    isOpen: boolean;
  }>({
    type: 'success',
    message: '',
    isOpen: false
  });

  // Fetch user data and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingUser(true);

        // Fetch user data
        const userResponse = await api.get<ApiResponse<User>>(`users/${id}`);
        if (userResponse && userResponse.data) {
          // ใช้ type assertion เพื่อให้เข้าถึงข้อมูลเพิ่มเติมได้
          const userData = userResponse.data as any;
          setFormData({
            name: userData.name || '',
            userName: userData.userName || '',
            phone: userData.phone || '',
            username: userData.username || userData.userName || '', // สำรองไว้เพื่อความเข้ากันได้กับระบบเก่า
            password: '',
            confirmPassword: '',
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            address: userData.address || '',
            birthDay: userData.birthDay || '',
            roleId: userData.roleId || (userData.role?.id || ''),
            status: userData.status,
            contactName: userData.contactName || '',
            contactNumber: userData.contactNumber || '',
            relationship: userData.relationship || '',
            companyId: userData.companyId || '',
            manpowerId: userData.manpowerId || '',
            agentKey: userData.agentKey || ''
          });
        } else {
          throw new Error('User not found');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('error', language === 'en' ? 'Failed to load user data' : 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        navigate('/manageusers');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchData();
  }, [id, navigate, language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // ตรวจสอบว่าเป็น checkbox หรือไม่
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: e.target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = language === 'en' ? 'Full name is required' : 'กรุณากรอกชื่อ-นามสกุล';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'en' ? 'Phone number is required' : 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^0[6-9]\d{8}$/.test(formData.phone)) {
      newErrors.phone = language === 'en' ? 'Invalid phone number format (e.g. 0812345678)' : 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)';
    }

    // Emergency contact validation - only validate if any of the fields are filled
    // if (formData.contactName || formData.contactNumber || formData.relationship) {
    //   // If one emergency contact field is filled, require the others
    //   if (!formData.contactName.trim()) {
    //     newErrors.contactName = language === 'en' ? 'Contact name is required when providing emergency contact' : 'กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน';
    //   }

    //   if (!formData.contactNumber.trim()) {
    //     newErrors.contactNumber = language === 'en' ? 'Contact number is required when providing emergency contact' : 'กรุณากรอกเบอร์โทรผู้ติดต่อฉุกเฉิน';
    //   } else if (!/^0[6-9]\d{8}$/.test(formData.contactNumber)) {
    //     newErrors.contactNumber = language === 'en' ? 'Invalid contact number format (e.g. 0812345678)' : 'รูปแบบเบอร์โทรผู้ติดต่อฉุกเฉินไม่ถูกต้อง (เช่น 0812345678)';
    //   }

    //   if (!formData.relationship.trim()) {
    //     newErrors.relationship = language === 'en' ? 'Relationship is required when providing emergency contact' : 'กรุณากรอกความสัมพันธ์กับผู้ติดต่อฉุกเฉิน';
    //   }
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData: Record<string, any> = {
        name: formData.name,
        phone: formData.phone,
        birthDay: formData.birthDay ? new Date(formData.birthDay).toISOString() : '',
        status: formData.status,
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        relationship: formData.relationship,
      };

      // Use the new API endpoint: users/update/:id
      const response = await api.put(`users/update/${id}`, userData);
      // ถ้าต้องการใช้งานข้อมูล user ที่ได้กลับมา ให้ assert type
      const updatedUser = response.data as User;

      if (response && (response.code === 200 || response.code === 204)) {
        showNotification('success', language === 'en' ? 'User updated successfully' : 'อัปเดตผู้ใช้สำเร็จ');
        setTimeout(() => {
          navigate('/manageusers');
        }, 1000);
      } else {
        throw new Error(response?.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      showNotification('error', error.message || (language === 'en' ? 'Failed to update user' : 'ไม่สามารถอัปเดตผู้ใช้ได้'));
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({
      type,
      message,
      isOpen: true
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, isOpen: false }));
    }, 1000);
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {notification.isOpen && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-white">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-[var(--color-primary,#0038A8)]">
          <h1 className="text-xl font-bold text-white">
            {language === 'en' ? 'Edit User' : 'แก้ไขผู้ใช้'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ชื่อ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Full Name' : 'ชื่อ-นามสกุล'} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            {/* เบอร์โทรศัพท์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์'} *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="0812345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            {/* วันเกิด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Birth Date' : 'วันเกิด'}
              </label>
              <input
                type="date"
                name="birthDay"
                value={formData.birthDay ? formData.birthDay.split('T')[0] : ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* ชื่อผู้ติดต่อฉุกเฉิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Emergency Contact Name' : 'ชื่อผู้ติดต่อฉุกเฉิน'}
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* เบอร์โทรผู้ติดต่อฉุกเฉิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Emergency Contact Number' : 'เบอร์โทรผู้ติดต่อฉุกเฉิน'}
              </label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0812345678"
              />
            </div>
            {/* ความสัมพันธ์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Relationship' : 'ความสัมพันธ์'}
              </label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* สถานะ */}
            <div className="flex items-center">
              <label className="flex items-top cursor-pointer">
                <div className="relative inline-block">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary,#0038A8)]"></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Active' : 'เปิดใช้งาน'}
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/manageusers')}
              className="px-4 cursor-pointer py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {language === 'en' ? 'Cancel' : 'ยกเลิก'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 cursor-pointer py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {language === 'en' ? 'Save Changes' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
