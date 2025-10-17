import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Tooltip from '~/components/Tooltip';
import {
  getApplicantById,
  getApplicantJobs,
  formatDate,
  selectPlanmaster,
  cancelPlanmaster
} from "../services/applicants";
import type { Applicant, JobApplication } from "../services/applicants";
import ImageViewer from "../components/ImageViewer";
import Toast from "../components/Toast";
import { useLanguage } from "~/components/DashboardLayout";
import { t } from "~/locales";
import EditApplicantPopup from "./EditApplicantPopup";
import api, { type ApiResponse } from "~/services/api";
import AgentStaffSelect from '../components/AgentStaffSelect';
import type { AgentStaffOption } from '../models/agent-staff';
import { getAgentStaffOptions } from '../services/applicants';

export default function ApplicantDetail() {
  // Get current user role from localStorage
  let currentUserRole = '';
  try {
    const jobyamUserAdmin = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
    currentUserRole = jobyamUserAdmin?.role?.name || '';
  } catch { }
  const allowedRoles = ['modulator', 'admin', 'supperAdmin', 'staff'];
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<Applicant>({
    id: '',
    mapUserJobId: '',
    name: '',
    email: '',  // This isn't in the interface but you might need it
    phone: '',
    company: '',
    manpower: '',
    contactName: '',
    contactNumber: '',
    birthDay: '',
    age: 0,
    assigned: '',
    assignedName: '',  // This isn't in the interface but you might need it
    status: false,     // Changed from 'new' to boolean
    sequence: 0,
    planName: '',
    planDate: '',
    createdAt: '',     // These aren't in the interface but you might need them
    updatedAt: ''      // These aren't in the interface but you might need them
  });
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingJobActions, setLoadingJobActions] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    isOpen: boolean;
  }>({
    type: 'success',
    message: '',
    isOpen: false
  });
  const { language } = useLanguage();
  const [editApplicant, setEditApplicant] = useState(false);
  const [agentStaffOptions, setAgentStaffOptions] = useState<AgentStaffOption[]>([]);
  const [enabledAgent, setEnabledAgent] = useState<boolean>(false);

  const effectRan = useRef(false);

  
  let role = '';
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
    role = user?.role?.name || '';
  }
  const showAdminColumn = !['agent'].includes(role);

  const handleStaffChange = async (staffId: string) => {
    if (!applicant) return;

    try {
      // Update local state immediately for better UX
      const selectedStaff = agentStaffOptions.find(staff => staff.id === staffId);
      setApplicant(prev => ({
        ...prev,
        assigned: staffId,
        assignedName: selectedStaff?.name || ''
      }));

      // Show success message
      setToast({
        message: t('update_success', language),
        type: 'success'
      });
      setTimeout(() => {
        navigate('/applicantlist');
      }, 1500);
    } catch (error) {
      console.error('Error updating staff assignment:', error);
      setToast({
        message: t('update_error', language),
        type: 'error'
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        // Fetch agent-staff options first
        const agentStaffResponse = await getAgentStaffOptions();
        if (isMounted) {
          if (agentStaffResponse.code === 200 && Array.isArray(agentStaffResponse.data)) {
            setAgentStaffOptions(agentStaffResponse.data);
          } else {
            console.error('Unexpected response format from getAgentStaffOptions:', agentStaffResponse);
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        if (isMounted) {
          setError('Failed to initialize application data. Please refresh the page.');
        }
      }
    };

    initializeData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch applicant data
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Try to get applicant data from sessionStorage first
        const storedApplicants = sessionStorage.getItem("applicants");
        let applicantData = null;

        if (storedApplicants) {
          const applicants = JSON.parse(storedApplicants);
          const foundApplicant = applicants.find((a: Applicant) => a.id === id);
          if (foundApplicant) {
            applicantData = foundApplicant;
          }
        }

        // If not found in sessionStorage, fetch from API
        if (!applicantData) {
          const response = await getApplicantById(id);
          if (response.data) {
            applicantData = response.data;
          }
        }

        if (applicantData) {
          setApplicant(applicantData);
          // Fetch job applications and agent staff
          const [jobsResponse] = await Promise.all([
            getApplicantJobs(id),
          ]);
          setJobs(jobsResponse.data);
          const hasActiveJob = jobsResponse.data.some((job: any) => job.status === true);
          setEnabledAgent(hasActiveJob);
        } else {
          setError("Applicant data not found");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to load data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSelectJob = async (mapUserJobId: string) => {
    try {
      setEnabledAgent(true);
      setLoadingJobActions(prev => ({ ...prev, [mapUserJobId]: true }));
      await selectPlanmaster(mapUserJobId);
      // Update the local job status
      setJobs(
        jobs.map((job) =>
          job.mapUserJobId === mapUserJobId ? { ...job, status: true } : job
        )
      );
      setToast({ message: "Job selected successfully", type: "success" });
    } catch (err) {
      console.error("Error selecting job:", err);
      setToast({
        message: "Unable to select job. Please try again.",
        type: "error"
      });
    } finally {
      setLoadingJobActions(prev => ({ ...prev, [mapUserJobId]: false }));
    }
  };

  const handleCancelJob = async (mapUserJobId: string) => {
    try {
      setEnabledAgent(false);
      setLoadingJobActions(prev => ({ ...prev, [mapUserJobId]: true }));
      await cancelPlanmaster(mapUserJobId);
      // Update the local job status
      setJobs(
        jobs.map((job) =>
          job.mapUserJobId === mapUserJobId ? { ...job, status: false } : job
        )
      );
      setToast({ message: "Job cancelled successfully", type: "success" });
    } catch (err) {
      console.error("Error canceling job:", err);
      setToast({
        message: "Unable to cancel job. Please try again.",
        type: "error"
      });
    } finally {
      setLoadingJobActions(prev => ({ ...prev, [mapUserJobId]: false }));
    }
  };

  // Function to handle navigation to job status page
  const handleViewJobStatus = (job: JobApplication) => {
    // Store applicant data in session storage
    if (applicant) {
      sessionStorage.setItem('applicantsById', JSON.stringify(applicant));
    }

    // Store job data in session storage
    sessionStorage.setItem('selectedJob', JSON.stringify(job));

    // Navigate to job status page
    navigate(`/applicants/status`);
  };

  const handleEditApplicant = async (updated: Applicant) => {
    const userData: Record<string, any> = {
      name: updated.name,
      phone: updated.phone,
      birthDay: updated.birthDay ? new Date(updated.birthDay).toISOString() : '',
      status: updated.status,
      contactName: updated.contactName,
      contactNumber: updated.contactNumber,
      relationship: updated.relationship,
    };
    const response = await api.put(`users/update/${id}`, userData);
    if (response && (response.code === 200 || response.code === 204)) {
      showNotification('success', language === 'en' ? 'User updated successfully' : 'อัปเดตผู้ใช้สำเร็จ');
      setApplicant(updated);
      sessionStorage.setItem("applicants", JSON.stringify([updated]));
    } else {
      throw new Error(response?.message || 'Unknown error');
    }
    setEditApplicant(false);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({
      type,
      message,
      isOpen: true
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">{t('loading', language)}</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => navigate("/applicants")}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-[var(--color-primary,#0038A8)] transition-colors"
            >
              {t('back_to_applicant_list', language)}
            </button>
          </div>
        </div>
      </div>
    );

  if (!applicant) return null;

  return (
    <div className="w-full p-6 h-full">
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

      {/* Edit Modal */}
      {editApplicant && (
        <EditApplicantPopup
          open={editApplicant}
          onClose={() => setEditApplicant(false)}
          applicant={applicant}
          onSave={(updated: Applicant) => {
            handleEditApplicant(updated);
          }}
        />
      )}

      {/* Header with breadcrumb */}
      <div className="mb-8">
        <nav className="sm:flex sm:items-center">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                to="/applicants"
                className="text-teal-600 hover:text-teal-800"
              >
                {t('applicant_list', language)}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-500 font-medium">{t('applicant_details', language)}</li>
          </ol>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {t('applicant_details', language)}
        </h1>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Applicant Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-6 pb-4 border-b gap-2">
                <svg
                  className="w-5 h-5 text-teal-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">
                  {t('personal_information', language)}
                </h2>
                <button
                  className="ml-1 px-2 py-1 rounded-full cursor-pointer bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow hover:scale-105 hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-150 flex items-center justify-center text-xs"
                  onClick={() => setEditApplicant(true)}
                  title={t('edit_applicant', language)}
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z" />
                  </svg>
                  <span className="ml-1 font-medium text-xs">{t('edit', language)}</span>
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-gray-600">
                    {t('name', language)}
                  </label>
                  <p className="text-gray-900">{applicant.name}</p>
                </div>
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-gray-600">
                    {t('phone', language)}
                  </label>
                  <p className="text-gray-900">{applicant.phone}</p>
                </div>
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-gray-600">
                    {t('age', language)}
                  </label>
                  <p className="text-gray-900">{applicant.age} ปี</p>
                </div>
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-gray-600">
                    {t('birthday', language)}
                  </label>
                  <p className="text-gray-900">
                    {formatDate(applicant.birthDay)}
                  </p>
                </div>
                {applicant.contactName && (
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-medium text-gray-600">
                      {t('contact_name', language)}
                    </label>
                    <p className="text-gray-900">{applicant.contactName}</p>
                  </div>
                )}
                {applicant.contactNumber && (
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-medium text-gray-600">
                      {t('contact_number', language)}
                    </label>
                    <p className="text-gray-900">{applicant.contactNumber}</p>
                  </div>
                )}
                {applicant.relationship && (
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-medium text-gray-600">
                      {t('relationship', language)}
                    </label>
                    <p className="text-gray-900">{applicant.relationship}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {showAdminColumn && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6 p-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="mr-2">{t('changeAdmin', language)}</span>
                <Tooltip content={language === 'th' ? 'กรุณาเลือกงานก่อนจึงจะสามารถเลือกผู้ติดตามงานได้' : 'Please select a job first to assign a staff member'}>
                  <svg 
                    className="w-6 h-6 text-gray-400 hover:text-gray-600 cursor-help" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </Tooltip>
              </div>
            </h3>
            <div className="mt-2">
              <AgentStaffSelect
                value={applicant.assigned || ''}
                onChange={handleStaffChange}
                options={agentStaffOptions}
                assignedId={applicant.mapUserJobId}
                disabled={!enabledAgent}
              />
            </div>
          </div>
          )}
        </div>

        {/* Right column - Job Applications */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 pb-4 border-b">
                {t('all_jobs', language)} ({jobs.length})
              </h2>
              <div className="space-y-6">
                {jobs.map((job) => (
                  <div
                    key={job.mapUserJobId}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="sm:w-32 flex-shrink-0">
                      <button
                        className="relative cursor-pointer w-full aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
                        onClick={() =>
                          setSelectedImage(
                            job.titleMedia
                              ? `${import.meta.env.VITE_API_URL_MEDIA}${job.titleMedia}`
                              : `${window.location.origin}/noimages2.png`
                          )
                        }
                      >
                        <img
                          src={
                            job.titleMedia
                              ? `${import.meta.env.VITE_API_URL_MEDIA}${job.titleMedia}`
                              : `${window.location.origin}/noimages2.png`
                          }
                          alt={job.job}
                          onError={e => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/noimages2.png";
                          }}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-colors">
                          <span className="text-white opacity-0 hover:opacity-100 bg-black/50 px-2 py-1 rounded text-sm transition-opacity">
                            {t('view_image', language)}
                          </span>
                        </div>
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {job.job}
                          </h3>
                          <p className="text-gray-600">{job.company}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(job.createdAt)}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-gray-500 text-sm">
                            {t('salary', language)}
                          </span>
                          <p className="mt-1 text-gray-900">{job.jobSalary}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">
                            {t('job_date', language)}
                          </span>
                          <p className="mt-1 text-gray-900">{job.jobDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">
                            {t('job_time', language)}
                          </span>
                          <p className="mt-1 text-gray-900">{job.jobTime}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex flex-wrap justify-between items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 mb-2 sm:mb-0">
                            {job.jobTypeName}
                          </span>
                          {job.status ? (
                            <div className="flex flex-wrap items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded mb-2 sm:mb-0">
                                ✅ {t('selected', language)}
                              </span>
                              <button
                                className="inline-flex items-center px-3 py-2 cursor-pointer border border-blue-500 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 mb-2 sm:mb-0"
                                onClick={() => handleViewJobStatus(job)}
                                disabled={loadingJobActions[job.mapUserJobId]}
                              >
                                {loadingJobActions[job.mapUserJobId] ? (
                                  <svg className="animate-spin h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                                {t('view_job_status', language)}
                              </button>
                              {allowedRoles.includes(currentUserRole) && (
                                <button
                                  onClick={() => handleCancelJob(job.mapUserJobId)}
                                  disabled={loadingJobActions[job.mapUserJobId]}
                                  className="inline-flex items-center px-3 py-2 cursor-pointer border border-red-500 text-sm font-medium rounded text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                >
                                  {loadingJobActions[job.mapUserJobId] ? (
                                    <svg className="animate-spin h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    "❌"
                                  )}
                                  {t('cancel_selection', language)}
                                </button>
                              )}
                            </div>
                          ) : (
                            jobs.some(j => j.status) ? null : (
                              <>
                                {allowedRoles.includes(currentUserRole) && (
                                  <button
                                    onClick={() => handleSelectJob(job.mapUserJobId)}
                                    disabled={loadingJobActions[job.mapUserJobId]}
                                    className="inline-flex cursor-pointer items-center px-3 py-2 border border-teal-500 text-sm font-medium rounded text-teal-500 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
                                  >
                                    {loadingJobActions[job.mapUserJobId] ? (
                                      <svg className="animate-spin h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      "✅"
                                    )}
                                    {t('select_job', language)}
                                  </button>
                                )}
                              </>
                            )
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => navigate("/applicants")}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('back', language)}
        </button>
      </div>

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage}
          alt="Job Image"
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
