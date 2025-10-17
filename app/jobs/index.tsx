import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AlertDialog from '../../components/shared/AlertDialog';
import { useLanguage } from '../components/DashboardLayout';
import { DataTable } from '../components/DataTable';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusToggle from '../components/StatusToggle';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { t } from '../locales';
import api from '../services/api';
import { deleteItem } from '../services/deleteService';
import { useUserRole } from './useUserRole';

interface Job {
  id: string;
  title: string;
  titleMedia: string;
  jobSalary: string;
  jobDate: string;
  jobTime: string;
  description: string;
  companyId: string;
  address: string;
  jobManpowerName: string;
  jobManpowerId?: string;
  jobManpowerDetail?: JobManpowerDetail;
  companyName: string;
  acceptingPosition: number;
  workingHoursPerWeek: number;
  images: string[];
  videos: string[];
  status: boolean;
}

interface JobManpowerDetail {
  id: string;
  name: string;
  detail?: string;
  contract?: string;
  contractNumber?: string;
  certificate?: string;
  address?: string;
  location?: string;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

const JobsIndex: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [selectedManpower, setSelectedManpower] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [searchPosition, setSearchPosition] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('');

  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getMediaUrl = (mediaPath: string | null | undefined): string => {
    if (!mediaPath) return '';

    if (mediaPath.startsWith('http')) {
      return mediaPath;
    }

    return `${import.meta.env.VITE_API_URL_MEDIA}${mediaPath}`;
  };

  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const userRole = useUserRole();
  const [jobManpowerId, setJobManpowerId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [showManpowerDetail, setShowManpowerDetail] = useState(false);
  const [selectedManpowerDetail, setSelectedManpowerDetail] = useState<JobManpowerDetail | null>(null);
  const effectRan = useRef(false);

  const filteredJobs = jobs.filter(job => {
    const positionMatch = searchPosition.trim() === '' ||
      job.title.toLowerCase().includes(searchPosition.trim().toLowerCase());

    const manpowerMatch = selectedManpower === '' ||
      job.jobManpowerDetail?.name === selectedManpower;

    const companyMatch = selectedCompany === '' ||
      job.companyName === selectedCompany;

    const contractMatch = contractFilter.trim() === '' ||
      job.jobManpowerDetail?.contractNumber?.toLowerCase().includes(contractFilter.trim().toLowerCase());

    const searchTermLower = searchTerm.trim().toLowerCase();
    const generalSearch = searchTerm.trim() === '' ||
      job.title.toLowerCase().includes(searchTermLower) ||
      job.companyName.toLowerCase().includes(searchTermLower) ||
      job.jobManpowerDetail?.name?.toLowerCase().includes(searchTermLower) ||
      job.jobSalary.toLowerCase().includes(searchTermLower) ||
      job.jobDate.toLowerCase().includes(searchTermLower) ||
      job.jobTime.toLowerCase().includes(searchTermLower) ||
      job.description?.toLowerCase().includes(searchTermLower) ||
      job.address?.toLowerCase().includes(searchTermLower) ||
      job.acceptingPosition.toString().includes(searchTermLower) ||
      job.jobManpowerDetail?.contractNumber?.toLowerCase().includes(searchTermLower) ||
      job.jobManpowerDetail?.address?.toLowerCase().includes(searchTermLower);

    return positionMatch && manpowerMatch && companyMatch && contractMatch && generalSearch;
  });

  const fetchJobs = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const cachedData = sessionStorage.getItem('jobs');
      if (cachedData && !forceRefresh) {
        const data = JSON.parse(cachedData);
        setJobs(data);
        setLoading(false);
        return;
      }
      const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
      const jobManpowerId = user.manpowerID || '';
      setJobManpowerId(jobManpowerId);
      const companyId = user.companyID || '';
      setCompanyId(companyId);
      const role = user.role.name || '';
      let url = 'jobs?page=1&limit=10000&user_id=' + user.id + '&type=admin&include_manpower=true';
      if (role.toLowerCase() === 'owner' || role.toLowerCase() === 'manpower') {
        if (role.toLowerCase() === 'manpower') {
          url += '&jobManpowerId=' + jobManpowerId
        } else if (role.toLowerCase() === 'owner') {
          url += '&companyId=' + companyId
        }
        url += '&role=' + role
      }
      try {
        const result = await api.get<ApiResponse<Job[]>>(url);
        if (result && result.code === 200 && result.status === 'OK') {
          sessionStorage.setItem('jobs', JSON.stringify(result.data.data));
          setJobs(result.data.data);
        } else {
          setJobs([]);
          setError(`Invalid API response format: ${result?.status || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('API request failed:', err);
        setJobs([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleUpCenter {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes glowPulse {
        0% { box-shadow: 0 0 5px #0d9488, 0 0 10px #0d9488, 0 0 15px #0d9488; }
        50% { box-shadow: 0 0 10px var(--color-primary, #0038A8), 0 0 20px var(--color-primary, #0038A8), 0 0 30px var(--color-primary, #0038A8); }
        100% { box-shadow: 0 0 5px var(--color-primary, #0038A8), 0 0 10px var(--color-primary, #0038A8), 0 0 15px var(--color-primary, #0038A8); }
      }

      @keyframes cyberpunkBorder {
        0% { border-color: #0d9488; }
        33% { border-color: var(--color-primary, #0038A8); }
        66% { border-color: var(--color-primary, #0038A8); }
        100% { border-color: var(--color-primary, #0038A8); }
      }

      @keyframes rotateGear {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }

      .scale-up-center {
        animation: scaleUpCenter 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      }

      .animate-glow {
        animation: glowPulse 2s infinite;
      }

      .animate-cyberpunk-border {
        animation: cyberpunkBorder 4s infinite;
      }

      .animate-gear {
        animation: rotateGear 2s linear infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    fetchJobs();
    if (effectRan.current) return;
    effectRan.current = true;
  }, [effectRan]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const clearAllFilters = () => {
    setSearchPosition('');
    setSelectedManpower('');
    setSelectedCompany('');
    setSearchTerm('');
    setContractFilter('');
  };

  return (
    <div className="min-h-screen relative">
      <LoadingOverlay isLoading={loading} />

      {error ? (
        <div className="text-red-500 text-center mt-8">{t('error', language)}</div>
      ) : (
        <div className="w-full">
          <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-fadeIn">
            <div className="flex-1 flex flex-col gap-2 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary,#0038A8)] tracking-tight flex items-center gap-2">
                {t('job_posting', language)}
              </h1>
              <p className="text-base text-gray-500 mt-0 mb-4 font-medium">{t('list_of_all_job_postings', language)}</p>
              <div className="bg-white/80 rounded-xl shadow-md overflow-visible mb-4 border border-gray-100">
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="relative animate-fadeIn">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="global-search"
                      className="pl-10 pr-10 py-2.5 border border-gray-300 bg-gray-50 focus:ring-[var(--color-primary,#0038A8)] focus:border-[var(--color-primary,#0038A8)] focus:bg-white block w-full text-sm rounded-lg transition duration-200"
                      placeholder={t('search_all_columns', language) || 'ค้นหาทุกคอลัมน์'}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none transition duration-200"
                          aria-label="Clear search"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* แสดงตัวกรองที่กำลังใช้งาน */}
                  {(searchPosition || selectedManpower || selectedCompany || searchTerm || contractFilter) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                      <div className="text-gray-500 mr-1">{t('filters', language)}:</div>

                      {searchTerm && (
                        <div className="bg-[var(--color-primary,#0038A8)]/10 px-2.5 py-1.5 rounded-full flex items-center group transition-all hover:bg-[var(--color-primary,#0038A8)]/20">
                          <span className="mr-2 text-[var(--color-primary,#0038A8)] font-medium">
                            {t('search', language)}: {searchTerm}
                          </span>
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-[var(--color-primary,#0038A8)]/70 hover:text-[var(--color-primary,#0038A8)] group-hover:bg-white rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {searchPosition && userRole !== 'owner' && userRole !== 'manpower' && (
                        <div className="bg-teal-50 px-2.5 py-1.5 rounded-full flex items-center group hover:bg-teal-100 transition-all">
                          <span className="mr-2 text-teal-700 font-medium">
                            {t('position', language)}: {searchPosition}
                          </span>
                          <button
                            onClick={() => setSearchPosition('')}
                            className="text-teal-400 hover:text-teal-700 group-hover:bg-white rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {selectedManpower && userRole !== 'owner' && userRole !== 'manpower' && (
                        <div className="bg-blue-50 px-2.5 py-1.5 rounded-full flex items-center group hover:bg-blue-100 transition-all">
                          <span className="mr-2 text-blue-700 font-medium">
                            {t('manpower', language)}: {selectedManpower}
                          </span>
                          <button
                            onClick={() => setSelectedManpower('')}
                            className="text-blue-400 hover:text-blue-600 group-hover:bg-white rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {selectedCompany && (
                        <div className="bg-purple-50 px-2.5 py-1.5 rounded-full flex items-center group hover:bg-purple-100 transition-all">
                          <span className="mr-2 text-purple-700 font-medium">
                            {t('company', language)}: {selectedCompany}
                          </span>
                          <button
                            onClick={() => setSelectedCompany('')}
                            className="text-purple-400 hover:text-purple-600 group-hover:bg-white rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {contractFilter && (
                        <div className="bg-amber-50 px-2.5 py-1.5 rounded-full flex items-center group hover:bg-amber-100 transition-all">
                          <span className="mr-2 text-amber-700 font-medium">
                            {t('contract_number', language)}: {contractFilter}
                          </span>
                          <button
                            onClick={() => setContractFilter('')}
                            className="text-amber-400 hover:text-amber-600 group-hover:bg-white rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* ปุ่มล้างตัวกรองทั้งหมด */}
                      <button
                        onClick={clearAllFilters}
                        className="ml-auto bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full flex items-center text-gray-600 hover:text-gray-700 transition-all"
                      >
                        <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {t('clear_all_filters', language)}
                      </button>
                    </div>
                  )}
                </div>

                {/* แสดงตัวกรองเพิ่มเติม */}
                <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* ช่องค้นหาตำแหน่งงาน */}
                  <div>
                    <label htmlFor="position-search" className="block text-xs font-medium text-gray-500 mb-1">
                      {t('search_position', language)}
                    </label>
                    <div className="relative rounded-md">
                      <input
                        type="text"
                        id="position-search"
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#0038A8)] focus:border-[var(--color-primary,#0038A8)] text-sm"
                        value={searchPosition}
                        onChange={e => setSearchPosition(e.target.value)}
                        placeholder={t('position', language)}
                      />
                      {searchPosition && (
                        <button
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                          onClick={() => setSearchPosition('')}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ตัวเลือก Manpower */}
                  <div>
                    <label htmlFor="manpower-filter" className="block text-xs font-medium text-gray-500 mb-1">
                      {t('manpower', language)}
                    </label>
                    <select
                      id="manpower-filter"
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#0038A8)] focus:border-[var(--color-primary,#0038A8)] sm:text-sm rounded-md"
                      value={selectedManpower}
                      onChange={e => setSelectedManpower(e.target.value)}
                      disabled={userRole === 'manpower'}
                    >
                      {jobManpowerId === "" && (<option value="">{t('all_jobs', language)}</option>)}
                      {[...new Set(jobs
                        .filter(job =>
                          (!jobManpowerId || jobManpowerId === "" || jobManpowerId === null || job.jobManpowerId === jobManpowerId) &&
                          (!companyId || companyId === "" || companyId === null || job.companyId === companyId)
                        )
                        .map(job => job.jobManpowerDetail?.name)
                        .filter(Boolean))]
                        .map(manpower => (
                          <option key={manpower} value={manpower}>
                            {manpower}
                          </option>
                        ))}
                    </select>
                  </div>


                  {/* ตัวเลือกบริษัท */}
                  <div>
                    <label htmlFor="company-filter" className="block text-xs font-medium text-gray-500 mb-1">
                      {t('company', language)}
                    </label>
                    <select
                      id="company-filter"
                      className={`block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#0038A8)] focus:border-[var(--color-primary,#0038A8)] sm:text-sm rounded-md ${userRole === 'owner' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      value={selectedCompany}
                      onChange={e => setSelectedCompany(e.target.value)}
                      disabled={userRole === 'owner'}
                    >
                      {companyId === "" && (<option value="">{t('all_jobs', language)}</option>)}
                      {[...new Set(jobs
                        .filter(job => !companyId || companyId === "" || companyId === null || job.companyId === companyId)
                        .map(job => job.companyName))]
                        .map(company => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                        ))}
                    </select>
                  </div>


                  {/* ค้นหาเลขที่สัญญา */}
                  <div>
                    <label htmlFor="contract-search" className="block text-xs font-medium text-gray-500 mb-1">
                      {t('contract_number', language)}
                    </label>
                    <div className="relative rounded-md">
                      <input
                        type="text"
                        id="contract-search"
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#0038A8)] focus:border-[var(--color-primary,#0038A8)] text-sm"
                        value={contractFilter}
                        onChange={e => setContractFilter(e.target.value)}
                        placeholder={t('contract_number', language)}
                      />
                      {contractFilter && (
                        <button
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                          onClick={() => setContractFilter('')}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto sm:justify-end">
                <button
                  onClick={() => fetchJobs(true)}
                  disabled={loading}
                  className={`inline-flex cursor-pointer items-center justify-center px-4 py-2 border-2 rounded-md shadow-sm text-sm font-medium text-white 
                bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 
                disabled:opacity-50 transition-all duration-300 w-full sm:w-auto ${loading ? 'animate-cyberpunk-border' : 'border-transparent'}`}
                >
                  {loading ? (
                    <>
                      <div className="relative -ml-1 mr-2">
                        <svg className="animate-gear h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="absolute inset-0 animate-glow rounded-full opacity-50"></div>
                      </div>
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
                {userRole !== 'staff' && (
                  <Link
                    to="/jobs/create"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary,#0038A8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 w-full sm:w-auto"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {t('create_job', language)}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isMobile ? (
              <div className="divide-y divide-gray-200">
                {filteredJobs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {t('no_jobs', language)}
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        {job.titleMedia ? (
                          isVideoFile(getMediaUrl(job.titleMedia)) ? (
                            <div
                              className="h-12 w-12 relative rounded-full overflow-hidden cursor-pointer flex-shrink-0"
                            >
                              <video
                                src={getMediaUrl(job.titleMedia)}
                                muted
                                className="h-full w-full object-cover"
                                onLoadedData={(e) => {
                                  const video = e.currentTarget;
                                  video.play().catch(() => console.log('Auto-play prevented by browser'));
                                  setTimeout(() => {
                                    video.pause();
                                  }, 1000);
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <div className="w-6 h-6 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getMediaUrl(job.titleMedia)}
                              alt={job.title}
                              className="h-12 w-12 rounded-full object-cover cursor-pointer flex-shrink-0"
                            />
                          )
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-sm">{t('no_image', language)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-base font-medium text-gray-900">
                            <Link to={`/jobs/${job.id}`} className="hover:text-teal-600">
                              {job.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">{job.companyName}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">{t('salary', language)}:</span> {job.jobSalary}
                        </div>
                        <div>
                          <span className="text-gray-500">{t('quantity', language)}:</span> {job.acceptingPosition} {t('quantity_unit', language)}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">{t('work_time', language)}:</span> {job.workingHoursPerWeek}
                        </div>
                        {job.jobManpowerDetail?.contractNumber && (
                          <div className="col-span-2">
                            <span className="text-gray-500">{t('contract', language)}:</span> {job.jobManpowerDetail.contractNumber}
                          </div>
                        )}
                        {job.jobManpowerDetail?.address && (
                          <div className="col-span-2">
                            <span className="text-gray-500">{t('address', language)}:</span> {job.jobManpowerDetail.address}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <StatusToggle
                          id={job.id}
                          initialStatus={job.status}
                          type="job"
                          onStatusChange={async (newStatus) => {
                            try {
                              await fetchJobs(true);
                            } catch (error) {
                              console.error('Failed to refresh jobs after status update:', error);
                            }
                          }}
                        />

                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-teal-600 hover:text-teal-800 cursor-pointer p-2"
                            title={t('view_details', language)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer p-2"
                            title={t('edit', language)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer p-2"
                            title={t('delete', language)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <DataTable
                data={filteredJobs}
                keyExtractor={(job) => job.id}
                columns={[
                  {
                    key: 'image',
                    title: t('image', language),
                    width: '80px',
                    render: (job) => (
                      <>
                        {job.titleMedia && (
                          isVideoFile(getMediaUrl(job.titleMedia)) ? (
                            <div
                              className="h-10 w-10 relative rounded-full overflow-hidden cursor-pointer"
                              onClick={() => {
                                setSelectedVideoUrl(getMediaUrl(job.titleMedia));
                                setIsVideoPlaying(true);
                              }}
                            >
                              <video
                                src={getMediaUrl(job.titleMedia)}
                                muted
                                className="h-full w-full object-cover"
                                onLoadedData={(e) => {
                                  const video = e.currentTarget;
                                  video.play().catch(() => console.log('Auto-play prevented by browser'));
                                  setTimeout(() => {
                                    video.pause();
                                  }, 1000);
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <div className="w-5 h-5 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getMediaUrl(job.titleMedia)}
                              alt={job.title}
                              className="h-10 w-10 rounded-full object-cover cursor-pointer"
                              onClick={() => setSelectedImage(getMediaUrl(job.titleMedia))}
                            />
                          )
                        )}
                      </>
                    )
                  },
                  {
                    key: 'title',
                    title: t('position', language),
                    sortable: true,
                    render: (job) => (
                      <div className="text-sm font-medium text-gray-900">
                        <Link to={`/jobs/${job.id}`} className="hover:text-teal-600 hover:underline">
                          {job.title}
                        </Link>
                      </div>
                    )
                  },
                  {
                    key: 'companyName',
                    title: t('company', language),
                    sortable: true,
                    render: (job) => (
                      <div className="text-sm text-gray-500">{job.companyName}</div>
                    )
                  },
                  {
                    key: 'jobManpowerName',
                    title: t('manpower', language),
                    sortable: true,
                    render: (job) => (
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>{job.jobManpowerDetail?.name}</span>
                          {job.jobManpowerDetail && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedManpowerDetail(job.jobManpowerDetail || null);
                                setShowManpowerDetail(true);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                              title={t('view_manpower_details', language)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'jobSalary',
                    title: t('salary', language),
                    render: (job) => (
                      <div className="text-sm text-gray-500">{job.jobSalary}</div>
                    )
                  },
                  {
                    key: 'jobDate',
                    title: t('work_time', language),
                    render: (job) => (
                      <div className="text-sm text-gray-500">
                        {job.workingHoursPerWeek}
                      </div>
                    )
                  },
                  {
                    key: 'acceptingPosition',
                    title: t('quantity', language),
                    sortable: true,
                    render: (job) => (
                      <div className="text-sm text-gray-500">{job.acceptingPosition} {t('quantity_unit', language)}</div>
                    )
                  },
                  {
                    key: 'contractInfo',
                    title: t('contract_info', language) || 'ข้อมูลสัญญา',
                    render: (job) => (
                      <div className="text-sm text-gray-500">
                        {job.jobManpowerDetail?.contractNumber ? (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.jobManpowerDetail.contractNumber}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    )
                  },
                  ...(userRole !== 'staff' ? [
                    {
                      key: 'status',
                      title: t('status', language),
                      render: (job: Job) => (
                        <StatusToggle
                          id={job.id}
                          initialStatus={job.status}
                          type="job"
                          onStatusChange={async () => {
                            try {
                              await fetchJobs(true);
                            } catch (error) {
                              console.error('Failed to refresh jobs after status update:', error);
                            }
                          }}
                        />
                      )
                    },
                    {
                      key: 'actions',
                      title: t('manage', language),
                      render: (job: Job) => (
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-teal-600 hover:text-teal-800 cursor-pointer"
                            title={t('view_details', language)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title={t('edit', language)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobId(job.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title={t('delete', language)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )
                    }
                  ] : [])
                ]}
                pagination={{
                  currentPage,
                  pageSize,
                  totalItems: filteredJobs.length,
                  onPageChange: setCurrentPage
                }}
                // onRowClick={(job) => navigate(`/jobs/${job.id}`)}
                className="bg-white rounded-lg shadow overflow-hidden"
              />
            )}
          </div>

          {selectedImage && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-full sm:max-w-4xl max-h-[90vh] w-full transform transition-all duration-300 scale-up-center">
                <img
                  src={selectedImage}
                  alt="Enlarged view"
                  className="w-full h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-white rounded-full p-2 hover:bg-gray-100 active:bg-gray-200 shadow-lg transform transition-transform duration-200 hover:scale-110 touch-manipulation"
                  onClick={() => setSelectedImage(null)}
                  aria-label="Close image"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {selectedVideoUrl && isVideoPlaying && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn"
              onClick={() => {
                setSelectedVideoUrl(null);
                setIsVideoPlaying(false);
              }}
            >
              <div className="relative max-w-full sm:max-w-4xl max-h-[90vh] w-full transform transition-all duration-300 scale-up-center">
                <video
                  src={selectedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-white rounded-full p-2 hover:bg-gray-100 active:bg-gray-200 shadow-lg transform transition-transform duration-200 hover:scale-110 touch-manipulation"
                  onClick={() => {
                    setSelectedVideoUrl(null);
                    setIsVideoPlaying(false);
                  }}
                  aria-label="Close video"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <AlertDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedJobId(null);
        }}
        onConfirm={async () => {
          if (selectedJobId) {
            try {
              const success = await deleteItem('job', selectedJobId);
              if (success) {
                fetchJobs(true);
                setDeleteDialogOpen(false);
              }
            } catch (error) {
              console.error('Failed to delete job:', error);
              setDeleteDialogOpen(false);
              setSelectedJobId(null);
            }
          }
        }}
        title={t('delete', language)}
        message={t('confirm_delete', language)}
      />

      {showManpowerDetail && selectedManpowerDetail && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowManpowerDetail(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto scale-up-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedManpowerDetail.name}</h3>
              <button
                onClick={() => setShowManpowerDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {selectedManpowerDetail.detail && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('detail', language)}:</h4>
                  <p className="text-gray-600">{selectedManpowerDetail.detail}</p>
                </div>
              )}

              {selectedManpowerDetail.contract && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('contract', language)}:</h4>
                  <p className="text-gray-600">{selectedManpowerDetail.contract}</p>
                </div>
              )}

              {selectedManpowerDetail.contractNumber && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('contract_number', language)}:</h4>
                  <p className="text-gray-600">{selectedManpowerDetail.contractNumber}</p>
                </div>
              )}

              {selectedManpowerDetail.address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('address', language)}:</h4>
                  <p className="text-gray-600">{selectedManpowerDetail.address}</p>
                </div>
              )}

              {selectedManpowerDetail.certificate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('certificate', language)}:</h4>
                  <a
                    href={`${import.meta.env.VITE_API_URL_MEDIA}${selectedManpowerDetail.certificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('view_certificate', language)}
                  </a>
                </div>
              )}

              {selectedManpowerDetail.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('location', language)}:</h4>
                  <a
                    href={selectedManpowerDetail.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('view_on_map', language)}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsIndex;
