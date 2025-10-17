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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
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

  // Fetch companies and job manpowers
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [jobManpowers, setJobManpowers] = useState<{ id: string; name: string }[]>([]);

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

        // Fetch roles for dropdown
        const rolesResponse = await api.get<ApiResponse<Role[]>>('role');
        if (rolesResponse && rolesResponse.data && Array.isArray(rolesResponse.data)) {
          // setRoles(rolesResponse.data.filter(role => role.status));
          const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
          const role = user.role.name || '';

          if (role.toLowerCase() === 'modulator') {
            let filteredRoles = rolesResponse.data.filter(role =>
              role.name.toLowerCase() !== 'user' && role.name.toLowerCase() !== 'admin' && role.name.toLowerCase() !== 'supperadmin'
            );
            setRoles(filteredRoles);
          } else if (role.toLowerCase() === 'admin') {
            let filteredRoles = rolesResponse.data.filter(role =>
              role.name.toLowerCase() !== 'user' && role.name.toLowerCase() !== 'supperadmin'
            );
            setRoles(filteredRoles);
          } else {
            let filteredRoles = rolesResponse.data.filter(role =>
              role.name.toLowerCase() !== 'user'
            );
            setRoles(filteredRoles);
          }
        }

        // Fetch companies
        const companiesResponse = await api.get<ApiResponse<any[]>>('jobs/company');
        if (companiesResponse && Array.isArray(companiesResponse.data)) {
          setCompanies(companiesResponse.data.map((c: any) => ({ id: c.id, name: c.name })));
        }

        // Fetch job manpowers
        const jobManpowersResponse = await api.get<ApiResponse<any[]>>('jobmanpower');
        if (jobManpowersResponse && Array.isArray(jobManpowersResponse.data)) {
          setJobManpowers(jobManpowersResponse.data.map((j: any) => ({ id: j.id, name: j.name })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('error', language === 'en' ? 'Failed to load user data' : 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        navigate('/manageadmin');
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
    } else if (name === 'agentKey') {
      setFormData({
        ...formData,
        [name]: value.toUpperCase()
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

  // สุ่มรหัส Agent Key
  const generateRandomAgentKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 10; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, agentKey: key }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Conditional validation for companyId and jobManpowerId
    const selectedRole = roles.find(r => r.id === formData.roleId)?.name?.toLowerCase();
    if (selectedRole === 'owner' && !formData.companyId) {
      newErrors.companyId = language === 'en' ? 'Please select a company' : 'กรุณาเลือกผู้ว่าจ้าง';
    }
    if (selectedRole === 'manpower' && !formData.manpowerId) {
      newErrors.manpowerId = language === 'en' ? 'Please select a ManPower Supply' : 'กรุณาเลือกผู้จัดหา';
    }
    if (selectedRole === 'agent' && !formData.agentKey) {
      newErrors.agentKey = language === 'en' ? 'Agent Key is required' : 'กรุณากรอก Agent Key';
    }

    // Username validation
    if (!formData.userName.trim()) {
      newErrors.userName = language === 'en' ? 'Username is required' : 'กรุณากรอกชื่อผู้ใช้';
    } else if (formData.userName.length < 3) {
      newErrors.userName = language === 'en' ? 'Username must be at least 3 characters' : 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = language === 'en' ? 'Full name is required' : 'กรุณากรอกชื่อ-นามสกุล';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = language === 'en' ? 'Email is required' : 'กรุณากรอกอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = language === 'en' ? 'Email is invalid' : 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'en' ? 'Phone number is required' : 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^0[6-9]\d{8}$/.test(formData.phone)) {
      newErrors.phone = language === 'en' ? 'Invalid phone number format (e.g. 0812345678)' : 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)';
    }

    // Password validation (only if provided)
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = language === 'en' ? 'Password must be at least 6 characters' : 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      }

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = language === 'en' ? 'Passwords do not match' : 'รหัสผ่านไม่ตรงกัน';
      }
    }

    // Role validation
    if (!formData.roleId) {
      newErrors.roleId = language === 'en' ? 'Please select a role' : 'กรุณาเลือกบทบาท';
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
        userName: formData.userName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        // แปลงรูปแบบวันที่ให้เป็น ISO format ถ้ามีการกรอกวันที่
        birthDay: formData.birthDay ? new Date(formData.birthDay).toISOString() : '',
        role_id: formData.roleId,
        agentKey: formData.agentKey, // เพิ่ม agentKey ใน payload
        status: formData.status,
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        relationship: formData.relationship,
        companyId: formData.companyId,
        manpowerId: formData.manpowerId
      };

      // Remove companyId/jobManpowerId if not relevant
      if (roles.find(r => r.id === formData.roleId)?.name?.toLowerCase() !== 'owner') {
        delete userData.companyId;
      }
      if (roles.find(r => r.id === formData.roleId)?.name?.toLowerCase() !== 'manpower') {
        delete userData.jobManpowerId;
      }

      // Only include password if it was provided
      if (formData.password) {
        userData.password = formData.password;
      }

      // Use the new API endpoint: users/update/:id
      const response = await api.put(`users/update/admin/${id}`, userData);

      if (response && (response.code === 200 || response.code === 204)) {
        showNotification('success', language === 'en' ? 'User updated successfully' : 'อัปเดตผู้ใช้สำเร็จ');
        setTimeout(() => {
          navigate('/manageadmin');
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
            {/* ชื่อผู้ใช้ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Username' : 'ชื่อผู้ใช้'} *
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.userName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.userName && (
                <p className="mt-1 text-sm text-red-600">{errors.userName}</p>
              )}
            </div>
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
            {/* อีเมล */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Email' : 'อีเมล'} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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
            {/* รหัสผ่านใหม่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'New Password' : 'รหัสผ่านใหม่'}
                <span className="text-xs text-gray-500 ml-1">
                  {language === 'en' ? '(leave blank to keep current)' : '(เว้นว่างเพื่อใช้รหัสผ่านเดิม)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10`}
                />
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={showPassword ? (language === 'en' ? 'Hide password' : 'ซ่อนรหัสผ่าน') : (language === 'en' ? 'Show password' : 'แสดงรหัสผ่าน')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    // Eye Off SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12.001C3.226 16.073 7.322 19.5 12 19.5c1.563 0 3.053-.317 4.41-.89m3.61-2.61A10.45 10.45 0 0022.066 12c-1.292-4.073-5.388-7.5-10.066-7.5-1.13 0-2.223.188-3.245.533M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.5 7.5 7.364 4.5 12 4.5c4.636 0 8.5 3 9.75 7.5-1.25 4.5-5.114 7.5-9.75 7.5-4.636 0-8.5-3-9.75-7.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Security guideline */}
              <p className="mt-2 text-xs text-gray-500">
                {language === 'en'
                  ? 'Password must be at least 6 characters. Use a combination of letters, numbers, and symbols for stronger security.'
                  : 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร ควรมีทั้งตัวอักษร ตัวเลข และสัญลักษณ์เพื่อความปลอดภัย'}
              </p>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            {/* ยืนยันรหัสผ่านใหม่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Confirm New Password' : 'ยืนยันรหัสผ่านใหม่'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10`}
                />
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={showConfirmPassword ? (language === 'en' ? 'Hide password' : 'ซ่อนรหัสผ่าน') : (language === 'en' ? 'Show password' : 'แสดงรหัสผ่าน')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    // Eye Off SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12.001C3.226 16.073 7.322 19.5 12 19.5c1.563 0 3.053-.317 4.41-.89m3.61-2.61A10.45 10.45 0 0022.066 12c-1.292-4.073-5.388-7.5-10.066-7.5-1.13 0-2.223.188-3.245.533M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.5 7.5 7.364 4.5 12 4.5c4.636 0 8.5 3 9.75 7.5-1.25 4.5-5.114 7.5-9.75 7.5-4.636 0-8.5-3-9.75-7.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
            {/* บทบาท */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Role' : 'บทบาท'} *
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.roleId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="">
                  {language === 'en' ? '-- Select Role --' : '-- เลือกบทบาท --'}
                </option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>
              )}
            </div>
            {/* Agent Key input for Agent role */}
            {roles.find(r => r.id === formData.roleId)?.name?.toLowerCase() === 'agent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Agent Key' : 'รหัสตัวแทน'} *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    name="agentKey"
                    value={formData.agentKey || ''}
                    onChange={handleChange}
                    maxLength={10}
                    disabled={true}
                    className={`w-2/3 px-3 py-2 border ${errors.agentKey ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase`}
                    placeholder={language === 'en' ? 'Enter or generate Agent Key' : 'กรอกหรือสร้าง Agent Key'}
                  />
                  <button
                    type="button"
                    onClick={generateRandomAgentKey}
                    className="w-1/3 px-3 py-2 cursor-pointer bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 text-white font-semibold rounded-md shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 hover:from-indigo-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95"
                  >
                    <svg className="inline-block w-4 h-4 mr-2 align-middle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {language === 'en' ? 'Random Key' : 'สุ่มรหัส'}
                  </button>
                </div>
                {errors.agentKey && (
                  <p className="mt-1 text-sm text-red-600">{errors.agentKey}</p>
                )}
              </div>
            )}
            {/* เงื่อนไขเลือกบริษัทสำหรับ Owner */}
            {roles.find(r => r.id === formData.roleId)?.name?.toLowerCase() === 'owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'ManPower Demand' : 'ผู้ว่าจ้าง'} *
                </label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.companyId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">{language === 'en' ? 'Select ManPower Demand' : 'เลือกผู้ว่าจ้าง'}</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
                )}
              </div>
            )}
            {/* เงื่อนไขเลือก Job Manpower สำหรับ Manpower */}
            {roles.find(r => r.id === formData.roleId)?.name?.toLowerCase() === 'manpower' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'ManPower Supply' : 'ผู้จัดหา'} *
                </label>
                <select
                  name="manpowerId"
                  value={formData.manpowerId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.manpowerId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">{language === 'en' ? 'Select ManPower Supply' : 'เลือกผู้จัดหา'}</option>
                  {jobManpowers.map(jm => (
                    <option key={jm.id} value={jm.id}>{jm.name}</option>
                  ))}
                </select>
                {errors.manpowerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.manpowerId}</p>
                )}
              </div>
            )}
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
            {/* ที่อยู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Address' : 'ที่อยู่'}
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
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
              onClick={() => navigate('/manageadmin')}
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
