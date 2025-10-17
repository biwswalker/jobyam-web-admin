import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { ApiResponse } from '../../services/api';

interface FormData {
  name: string;
  detail: string;
  contract: string;
  contractNumber: string;
  certificate: string;
  address: string;
  location: string;
  status: boolean;
}

interface JobManpower {
  id: string;
  name: string;
  detail?: string;
  contract?: string;
  contractNumber?: string;
  certificate?: string;
  address?: string;
  location?: string;
}

export function meta() {
  return [
    { title: "เพิ่ม Job Manpower - JobYam Admin" },
    { name: "description", content: "Create new Job Manpower entry" },
  ];
}

export default function CreateJobManpower() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    detail: '',
    contract: '',
    contractNumber: '',
    certificate: '',
    address: '',
    location: '',
    status: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // ตรวจสอบประเภทไฟล์ให้เป็น PDF เท่านั้น
      if (file.type !== 'application/pdf') {
        setError('กรุณาอัพโหลดไฟล์ PDF เท่านั้น');
        e.target.value = '';  // ล้างค่าไฟล์ที่เลือก
        return;
      }

      setCertificateFile(file);
      setError(null);  // ล้างข้อความแจ้งเตือนหากมี
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!certificateFile) {
        throw new Error('กรุณาอัพโหลดหนังสือรับรอง');
      }

      // ตรวจสอบรูปแบบพิกัดอย่างง่าย (ถ้ามีการกรอก)
      if (formData.location && formData.location.trim() !== '') {
        // ตรวจสอบเฉพาะว่ามีรูปแบบเป็น ตัวเลข.ตัวเลข,ตัวเลข.ตัวเลข
        const simplifiedCheck = /\d+\.\d+,\d+\.\d+/.test(formData.location);

        if (!simplifiedCheck) {
          throw new Error('รูปแบบพิกัดไม่ถูกต้อง กรุณากรอกในรูปแบบ "ละติจูด,ลองจิจูด" เช่น "12.123123,100.9992"');
        }
      }

      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(formData));

      if (certificateFile) {
        formDataToSend.append('certificate', certificateFile);
      }

      const result = await api.post<ApiResponse<JobManpower>>("jobmanpower", formDataToSend);

      if (result.code !== 200) {
        throw new Error(
          result.status ||
          "Failed to create job"
        );
      }

      // Fetch updated list after successful creation
      const jobmanpower = await api.get<ApiResponse<JobManpower[]>>('jobmanpower');

      if (jobmanpower.code === 200 && jobmanpower.status === 'OK' && Array.isArray(jobmanpower.data)) {
        sessionStorage.setItem('jobManpowers', JSON.stringify(jobmanpower.data));
        navigate('/jobmanpower');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">เพิ่ม Job Manpower</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ Manpower <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียด
            </label>
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์ติดต่อ
            </label>
            <input
              type="tel"
              name="contractNumber"
              value={formData.contractNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              พิกัด (Latitude, Longitude)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="12.121221,100.123123"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500">รูปแบบ: ละติจูด,ลองจิจูด (เช่น 12.121221,100.123123)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หนังสือรับรอง <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500">กรุณาอัพโหลดไฟล์ PDF เท่านั้น</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="status"
              checked={formData.status}
              onChange={handleInputChange}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              เปิดใช้งาน
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/jobmanpower')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
