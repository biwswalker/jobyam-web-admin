import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '~/components/DashboardLayout';

interface FormData {
  name: string;
  subName: string;
  status?: boolean;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

interface JobType {
  id: string;
  name: string;
  subName: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function meta() {
  return [
    { title: "แก้ไขประเภทงาน - JobYam Admin" },
    { name: "description", content: "Edit job type information" },
  ];
}

export default function EditJobType() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const [jobType, setJobType] = useState<FormData>({
    name: '',
    subName: '',
    status: true
  });

  useEffect(() => {
    const fetchJobType = async () => {
      try {
        // Using the query parameter format you specified
        const result = await api.get<ApiResponse<JobType>>(`jobs/types?id=${id}`);
        if (result.code !== 200 || !result.data.data) {
          throw new Error("Failed to fetch job type or job type not found");
        }

        // Get the first item from the response array
        const jobTypeData = result.data.data;

        setJobType({
          name: jobTypeData.name || '',
          subName: jobTypeData.subName || '',
          status: jobTypeData.status !== undefined ? jobTypeData.status : true
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchJobType();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setJobType(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.put<ApiResponse<JobType>>(`jobs/types/${id}`, jobType);

      if (result.code === 200 && result.status === 'OK') {
        navigate('/jobs/types');
      } else {
        throw new Error('Failed to update job type');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{language === 'th' ? 'แก้ไขประเภทงาน' : 'Edit Job Type'}</h1>

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
              {language === 'th' ? 'ชื่อประเภทงาน' : 'Job Type Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={jobType.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="เช่น ภาคอุตสาหกรรม"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'th' ? 'แผนกงาน' : 'Department'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subName"
              value={jobType.subName}
              onChange={handleInputChange}
              // required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="เช่น ภาคอุตสาหกรรม"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={jobType.status}
              onChange={handleInputChange}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
              {language === 'th' ? 'เปิดใช้งาน' : 'Active'}
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/jobs/types')}
              className="px-4 py-2 border cursor-pointer border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center cursor-pointer px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {loading ? language === 'th' ? 'กำลังบันทึก...' : 'Saving...' : language === 'th' ? 'บันทึก' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
