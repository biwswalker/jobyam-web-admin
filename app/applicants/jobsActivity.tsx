import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '~/components/DashboardLayout';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { t } from '../locales';
import type { ApplicantActivity, JobApplication } from '../services/applicants';
import { formatDate, getApplicantsActivityByRole } from '../services/applicants';

import { useParams } from 'react-router-dom';
import JobDetail from '~/jobs/detail';

export default function ApplicantsIndex() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const flag = id || 'all'; // เช่น /jobsActivity/delayed จะได้ flag = 'delayed', ถ้าไม่มี id จะเป็น 'all'

  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantActivity[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<ApplicantActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { language } = useLanguage();
  const effectRan = useRef(false);

  // Fetch applicants data
  const fetchApplicants = async (forceRefresh = false) => {
    try {
      if (effectRan.current) return;
      effectRan.current = true;
      setLoading(true);
      // Check sessionStorage first if not forcing refresh
      // const cachedData = sessionStorage.getItem('applicants');
      // if (cachedData && !forceRefresh && cachedData !== null) {
      //   const data = JSON.parse(cachedData);
      //   setApplicants(data);
      //   setFilteredApplicants(data);
      //   setLoading(false);
      //   return;
      // }

      // Get user_id and role from localStorage
      const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
      const userId = user.id || '';
      const role = user.role.name || '';
      // If no cached data or forcing refresh, fetch from API
      const response = await getApplicantsActivityByRole(role, userId, flag);
      sessionStorage.setItem('applicantsActivity', JSON.stringify(response.data));
      setApplicants(response.data || []);
      setFilteredApplicants(response.data || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setError('Unable to load applicant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchApplicants();
  }, []);

  // Filter applicants based on search term
  useEffect(() => {
    if (applicants === null) {
      return;
    }
    let result = [...applicants];

    if (searchTerm) {
      result = result.filter(
        applicant =>
          applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          applicant.phone.includes(searchTerm)
      );
    }

    setFilteredApplicants(result);
  }, [searchTerm, applicants]);

  // Function to handle navigation to job status page
  const handleViewJobStatus = (applicant: ApplicantActivity) => {
    // Store applicant data in session storage
    if (applicant) {
      sessionStorage.setItem('applicantsById', JSON.stringify(applicant));
    }

    // Store job data in session storage
    sessionStorage.setItem('selectedJob', JSON.stringify(applicant));

    // Navigate to job status page
    navigate(`/applicants/status`);
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {flag === 'all' ? t('applicants_all', language) : flag === 'delayed' ? t('applicants_delayed', language) : flag === 'success' ? t('applicants_success', language) : t('applicants_list', language)}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('no_applicants', language)}</p>
        </div>
        <button
          onClick={() => fetchApplicants(true)}
          disabled={loading}
          className="inline-flex cursor-pointer items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('loading', language)}
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('refresh', language)}
            </>
          )}
        </button>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <label htmlFor="search" className="sr-only">{t('search', language)}</label>
            <input
              type="text"
              id="search"
              className="pl-10 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full text-sm border-gray-300 rounded-lg py-3 bg-white transition duration-150 ease-in-out"
              placeholder={t('search_name_phone', language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicants table/cards */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mb-2"></div>
            <p>{t('loading', language)}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{t('unable_to_load_applicant_data', language)}</p>
            <button
              className="mt-4 px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700"
              onClick={() => window.location.reload()}
            >
              {t('retry', language)}
            </button>
          </div>
        ) : isMobile ? (
          // Mobile card view
          <div className="divide-y divide-gray-200">
            {filteredApplicants.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                {t('no_applicants', language)}
              </div>
            ) : (
              filteredApplicants.map((applicant) => (
                <div key={applicant.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                      {applicant.name.charAt(0)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                      <div className="text-sm text-gray-500">{applicant.phone}</div>
                    </div>
                    <button
                      className="text-blue-600 cursor-pointer hover:text-blue-900 p-2"
                    // onClick={() => handleViewDetails(applicant.id)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">{t('age', language)}:</span> {applicant.age} ปี
                    </div>
                    <div>
                      <span className="text-gray-500">{t('birthday', language)}:</span> {formatDate(applicant.birthDay)}
                    </div>
                    <div>
                      <span className="text-gray-500">{t('contact_name', language)}:</span> {applicant.contactName || '-'}
                    </div>
                    <div>
                      <span className="text-gray-500">{t('contact_number', language)}:</span> {applicant.contactNumber || '-'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Desktop table view
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('image', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('job', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('company', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('manpower', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('applicant', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('personal_information', language)}
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('contact', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('contact', language)}
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions', language)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {t('no_applicants', language)}
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded overflow-hidden border shadow cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => setPreviewImage(applicant.titleMedia
                              ? `${import.meta.env.VITE_API_URL_MEDIA}${applicant.titleMedia}`
                              : `${window.location.origin}/noimages2.png`)}>
                            <img
                              src={applicant.titleMedia
                                ? `${import.meta.env.VITE_API_URL_MEDIA}${applicant.titleMedia}`
                                : `${window.location.origin}/noimages2.png`}
                              alt={applicant.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm text-gray-500">{applicant.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm text-gray-500">{applicant.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm text-gray-500">{applicant.manpower}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                            {applicant.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                            <div className="text-sm text-gray-500">{applicant.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="text-sm font-medium">{applicant.age} ปี</div>
                          <div className="text-sm text-gray-500">{formatDate(applicant.birthDay)}</div>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{applicant.contactName || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{applicant.contactNumber || '-'}</div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${applicant.status ? 'text-green-600' : 'text-red-500'}`}
                        >
                          {language === 'en'
                            ? applicant.status
                              ? 'Selected'
                              : 'Not selected'
                            : applicant.status
                              ? 'เลือกงานแล้ว'
                              : 'ยังไม่เลือกงาน'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 cursor-pointer hover:text-blue-900"
                            onClick={() => handleViewJobStatus(applicant)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && filteredApplicants.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            {t('showing_applicants', language, { count: filteredApplicants.length })}
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('previous', language)}
            </button>
            <button className="flex-1 sm:flex-none px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('next', language)}
            </button>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blur bg-opacity-50 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <img
            src={previewImage}
            alt="Preview"
            className="w-auto h-auto max-w-[98vw] max-h-[95vh] rounded-lg shadow-2xl border-4 border-white"
            onClick={e => e.stopPropagation()}
            style={{ objectFit: 'contain' }}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-blur bg-opacity-40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
          >
          </button>
        </div>
      )}
    </div>
  );
}
