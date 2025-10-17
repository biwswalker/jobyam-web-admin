import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '~/components/DashboardLayout';

interface FormData {
  name: string;
  subName: string;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

interface JobType {
  name: string;
  subName: string;
}

export function meta() {
  return [
    { title: "เพิ่มประเภทงาน - JobYam Admin" },
    { name: "description", content: "Create new job type" },
  ];
}

export default function CreateJobType() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const [jobType, setJobType] = useState<FormData>({
    name: '',
    subName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobType(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.post<ApiResponse<JobType>>('jobs/types', jobType);

      if (result.code === 201 && result.status === 'Created') {
        // // Fetch updated job types
        // const jobTypesResult = await api.get<ApiResponse<JobType[]>>('jobs/types');
        // if (jobTypesResult.code === 200 && jobTypesResult.status === 'OK' && Array.isArray(jobTypesResult.data)) {
        //   sessionStorage.setItem('jobTypes', JSON.stringify(jobTypesResult.data));
        // } else {
        //   throw new Error('Invalid response format for job types');
        // }

        // // Fetch updated jobs
        // const jobsResult = await api.get<ApiResponse<any[]>>('jobs');
        // if (jobsResult.code === 200 && jobsResult.status === 'OK' && Array.isArray(jobsResult.data)) {
        //   sessionStorage.setItem('jobs', JSON.stringify(jobsResult.data));
        // } else {
        //   throw new Error('Invalid response format for jobs');
        // }

        navigate('/jobs/types');
      } else {
        throw new Error('Failed to create job type');
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{language === 'en' ? 'Create Job Type' : 'เพิ่มประเภทงาน'}</h1>

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
              {language === 'en' ? 'Job Type Name' : 'ชื่อประเภทงาน'} <span className="text-red-500">*</span>
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
              {language === 'en' ? 'Department' : 'แผนกงาน'} <span className="text-red-500">*</span>
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

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/jobs/types')}
              className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {language === 'en' ? 'Cancel' : 'ยกเลิก'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {loading ? (language === 'en' ? 'Saving...' : 'กำลังบันทึก...') : (language === 'en' ? 'Submit' : 'บันทึก')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
