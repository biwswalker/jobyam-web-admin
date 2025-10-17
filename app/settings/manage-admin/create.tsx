import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../components/DashboardLayout';

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
    { title: "Add User - JobYam Admin" },
    { name: "description", content: "Create a new user" },
  ];
}

export default function CreateUserPage() {
  // Add jobManpowers state
  const [jobManpowers, setJobManpowers] = useState<{ id: string; name: string }[]>([]);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDay: '',
    address: '',
    contactName: '',
    contactNumber: '',
    relationship: '',
    roleId: '',
    agentKey: '', // Agent Key for Agent role
    status: true,
    companyId: '', // เพิ่ม companyId
    manpowerId: '' // เพิ่ม manpowerId
  });

  // สถานะสำหรับการแสดงรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Fetch roles and companies for dropdowns
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // if (roleRan.current) return;
        // roleRan.current = true;
        const result = await api.get<ApiResponse<{ id: string, name: string }[]>>('role');
        if (result.code === 200 && result.status === 'OK' && Array.isArray(result.data)) {
  
          // Get user_id and role from localStorage
          const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
          const role = user.role.name || '';
  
          if (role.toLowerCase() === 'modulator') {
            let filteredRoles = result.data.filter(role =>
              role.name.toLowerCase() !== 'user' && role.name.toLowerCase() !== 'admin' && role.name.toLowerCase() !== 'supperadmin'
            );
            setRoles(filteredRoles);
          } else if (role.toLowerCase() === 'admin') {
            let filteredRoles = result.data.filter(role =>
              role.name.toLowerCase() !== 'user' && role.name.toLowerCase() !== 'supperadmin'
            );
            setRoles(filteredRoles);
          } else {
            let filteredRoles = result.data.filter(role =>
              role.name.toLowerCase() !== 'user'
            );
            setRoles(filteredRoles);
          }
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchRoles();
    // Fetch companies
    const fetchCompanies = async () => {
      try {
        const result = await api.get<ApiResponse<{ id: string; name: string }[]>>('jobs/company');
        if (result && result.data && Array.isArray(result.data)) {
          setCompanies(result.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        showNotification('error', language === 'en' ? 'Failed to load companies' : 'ไม่สามารถโหลดข้อมูลบริษัทได้');
      }
    };
    fetchCompanies();
    // Fetch job manpowers
    const fetchJobManpowers = async () => {
      try {
        const result = await api.get<ApiResponse<{ id: string; name: string }[]>>('jobmanpower');
        if (result && result.data && Array.isArray(result.data)) {
          setJobManpowers(result.data);
        }
      } catch (error) {
        console.error('Error fetching job manpowers:', error);
        showNotification('error', language === 'en' ? 'Failed to load job manpowers' : 'ไม่สามารถโหลดข้อมูล Job Manpower ได้');
      }
    };
    fetchJobManpowers();
  }, [language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
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

  // Random Agent Key generator
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = language === 'en' ? 'Full name is required' : 'กรุณากรอกชื่อ-นามสกุล';
    }

    // Username validation
    if (!formData.userName.trim()) {
      newErrors.userName = language === 'en' ? 'Username is required' : 'กรุณากรอกชื่อผู้ใช้';
    } else if (formData.userName.length < 3) {
      newErrors.userName = language === 'en' ? 'Username must be at least 3 characters' : 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
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

    // Conditional validation for companyId and manpowerId
    const selectedRole = roles.find(r => r.id === formData.roleId)?.name?.toLowerCase();
    if (selectedRole === 'owner' && !formData.companyId) {
      newErrors.companyId = language === 'en' ? 'Please select a company' : 'กรุณาเลือกผู้ว่าจ้าง';
    }
    if (selectedRole === 'manpower' && !formData.manpowerId) {
      newErrors.manpowerId = language === 'en' ? 'Please select a ManPower Supply' : 'กรุณาเลือกผู้จัดหา';
    }
    // Agent key validation
    if (selectedRole === 'agent' && !formData.agentKey) {
      newErrors.agentKey = language === 'en' ? 'Agent Key is required' : 'กรุณากรอก Agent Key';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = language === 'en' ? 'Password is required' : 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'en' ? 'Password must be at least 6 characters' : 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'en' ? 'Passwords do not match' : 'รหัสผ่านไม่ตรงกัน';
    }

    // Role validation
    if (!formData.roleId) {
      newErrors.roleId = language === 'en' ? 'Please select a role' : 'กรุณาเลือกบทบาท';
    }

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
      // สร้างวันที่ในรูปแบบ ISO string
      const birthDayISO = formData.birthDay ? new Date(formData.birthDay).toISOString() : new Date().toISOString();

      const userData = {
        name: formData.name,
        userName: formData.userName,
        password: formData.password,
        phone: formData.phone,
        birthDay: birthDayISO,
        email: formData.email,
        address: formData.address,
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        relationship: formData.relationship,
        RoleID: formData.roleId,
        agentKey: formData.agentKey, // Send agentKey if present
        companyId: formData.companyId,
        manpowerId: formData.manpowerId,
        status: formData.status
      };

      const response = await api.post('users/register/admin', userData);

      if (response && response.code === 200) {
        showNotification('success', language === 'en' ? 'User created successfully' : 'สร้างผู้ใช้สำเร็จ');
        setTimeout(() => {
          navigate('/manageadmin');
        }, 1000);
      } else {
        throw new Error(response?.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      showNotification('error', error.message || (language === 'en' ? 'Failed to create user' : 'ไม่สามารถสร้างผู้ใช้ได้'));
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
            {language === 'en' ? 'Add New User' : 'เพิ่มผู้ใช้ใหม่'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Full Name' : 'ชื่อ-นามสกุล'} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder={language === 'en' ? 'Full Name' : 'ชื่อ-นามสกุล'}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Username' : 'ชื่อผู้ใช้'} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.userName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder={language === 'en' ? 'Username' : 'ชื่อผู้ใช้'}
              />
              {errors.userName && <p className="mt-1 text-sm text-red-600">{errors.userName}</p>}
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Email' : 'อีเมล'} <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="example@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์'} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="0812345678"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Password' : 'รหัสผ่าน'} <span className="text-red-600">*</span>
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
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C2.25 12 5.25 5.25 12 5.25s9.75 6.75 9.75 6.75-3 6.75-9.75 6.75S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
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
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Confirm Password' : 'ยืนยันรหัสผ่าน'} <span className="text-red-600">*</span>
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
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C2.25 12 5.25 5.25 12 5.25s9.75 6.75 9.75 6.75-3 6.75-9.75 6.75S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Birthday' : 'วันเกิด'}
              </label>
              <input
                type="date"
                name="birthDay"
                value={formData.birthDay}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Role' : 'บทบาท'} <span className="text-red-600">*</span>
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.roleId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="">{language === 'en' ? 'Select Role' : 'เลือกบทบาท'}</option>
                {roles.filter(role => role.status).map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              {errors.roleId && <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>}
            </div>
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
                {errors.jobManpowerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobManpowerId}</p>
                )}
              </div>
            )}

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
            {/* Emergency Contact Name */}
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
                placeholder={language === 'en' ? 'Emergency Contact Name' : 'ชื่อผู้ติดต่อฉุกเฉิน'}
              />
            </div>
            {/* Emergency Contact Number */}
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
                placeholder={language === 'en' ? 'Emergency Contact Number' : 'เบอร์โทรผู้ติดต่อฉุกเฉิน'}
              />
            </div>
            {/* Relationship & Status (same row) */}
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
            {/* Address */}
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
            {/* Status */}
            <div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
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
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/manageadmin')}
              className="px-4 py-2 cursor-pointer bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {language === 'en' ? 'Cancel' : 'ยกเลิก'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {language === 'en' ? 'Create User' : 'สร้างผู้ใช้'}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}
