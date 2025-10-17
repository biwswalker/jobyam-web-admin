import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface FormData {
  name: string;
  address: string;
  email: string;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

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

export function meta() {
  return [
    { title: "เพิ่มบริษัท - JobYam Admin" },
    { name: "description", content: "Create new company" },
  ];
}

export default function CreateCompany() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [company, setCompany] = useState<FormData>({
    name: '',
    address: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.post<ApiResponse<Company>>('jobs/company', company);
      
      if (result.code === 201 && result.status === 'Created') {
        // Fetch updated companies
        const companiesResult = await api.get<ApiResponse<Company[]>>('jobs/company');
        if (companiesResult.code === 200 && companiesResult.status === 'OK' && Array.isArray(companiesResult.data)) {
          sessionStorage.setItem('companies', JSON.stringify(companiesResult.data));
        } else {
          throw new Error('Invalid response format for ManPower Demand');
        }

        navigate('/company');
      } else {
        throw new Error('Failed to create company');
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">ผุ้ว่าจ้าง</h1>

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
              ชื่อผู้ว่าจ้าง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={company.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="ชื่อผู้ว่าจ้าง"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              value={company.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="อีเมล"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่
            </label>
            <textarea
              name="address"
              value={company.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="ที่อยู่"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/company')}
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
