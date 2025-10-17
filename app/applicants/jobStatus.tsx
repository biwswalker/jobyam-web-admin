import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlanmasterById, type Applicant, type JobApplication } from '../services/applicants';
import api from '../services/api';
import Toast from '../components/Toast';
import { useLanguage } from "~/components/DashboardLayout";
import { t } from "~/locales";
// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/';

// Interface for file upload response
interface FileUploadResponse {
  data: {
    attractFile: string;
    attractFileDate: string;
    id: string;
    // Other fields can be added as needed
  };
  message: string;
}

// Interface for template data
interface Template {
  id: string;
  sid: number;
  detail: string;
  subDetail: string;
  attractFile: string;
  detailDate: string;
  attractFileDate: string;
  nameAttractFile: string;
  status: boolean;
}

// Interface for planmaster data
interface PlanMaster {
  id?: string;
  mapUserJobId?: string;
  templateMasterId?: string;
  planName?: string;
  sequence?: number;
  detail?: string;
  detailDate?: string;
  status: boolean;
  attractFileDate: string;
  attractFile?: string;
  nameAttractFile?: string;
  templates: Template[];
}

export default function ApplicantJobStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [job, setJob] = useState<JobApplication | null>(null);
  const [planmasters, setPlanmasters] = useState<PlanMaster[]>([]);
  const [statusValue, setStatusValue] = useState<string>('สมัครใหม่');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [hasFilesToDownload, setHasFilesToDownload] = useState(false);
  const effectRan = useRef(false);
  const effectRan1 = useRef(false);

  // Check for files when component mounts and when planmasters change
  useEffect(() => {
    const totalFiles = planmasters.reduce((total, plan) =>
      total + plan.templates.filter(t => t.attractFile).length, 0
    );
    setHasFilesToDownload(totalFiles > 0);
  }, [planmasters]);
  const [savingPlanDetail, setSavingPlanDetail] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    planId: string;
    title: string;
    message: string;
  }>({ show: false, planId: '', title: '', message: '' });
  const { language } = useLanguage();

  // State for template editing
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanName, setEditingPlanName] = useState<string>('');

  // State for file attachment popup
  const [fileAttachmentPopup, setFileAttachmentPopup] = useState<{
    show: boolean;
    plan: PlanMaster | null;
  }>({ show: false, plan: null });
  const [fileAttachmentForm, setFileAttachmentForm] = useState<{
    detail: string;
    subDetail: string;
    attractFile: string;
    detailDate: string;
  }>({
    detail: '',
    subDetail: '',
    attractFile: '',
    detailDate: new Date().toISOString().split('T')[0]
  });

  // Validation state for required fields
  const [formErrors, setFormErrors] = useState<{
    detail: boolean;
    subDetail: boolean;
    detailDate: boolean;
  }>({ detail: false, subDetail: false, detailDate: false });

  // Load applicant and job data
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        let applicantData = null;
        let jobData = null;

        // Try to get applicant data from sessionStorage first
        const storedApplicantsById = sessionStorage.getItem("applicantsById");
        if (storedApplicantsById) {
          try {
            // Check if the data is already an object or needs to be parsed
            applicantData = typeof storedApplicantsById === 'object' ?
              storedApplicantsById : JSON.parse(storedApplicantsById);

            setApplicant(applicantData);
            if (applicantData && applicantData.id) {
              handleStatusChange(applicantData.id);
            }
          } catch (e) {
            console.error("Error parsing applicant data from session storage:", e);
          }
        }

        // Try to get job data from sessionStorage
        const storedJob = sessionStorage.getItem("selectedJob");
        if (storedJob) {
          try {
            jobData = JSON.parse(storedJob);
            setJob(jobData);
          } catch (e) {
            console.error("Error parsing job data from session storage:", e);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (id: string) => {
    const jobsResponse = await getPlanmasterById(id);
    if (jobsResponse.code === 200 && jobsResponse.status === "OK") {
      // Check if the data is already an object or needs to be parsed
      const planmasterData = typeof jobsResponse.data === 'string' ?
        JSON.parse(jobsResponse.data) : jobsResponse.data;
      setPlanmasters(planmasterData);

      // Find the planName with highest sequence where status is true

      const latestActivePlan = planmasterData
        .filter((plan: PlanMaster) => plan.status)
        .sort((a: PlanMaster, b: PlanMaster) => (b.sequence || 0) - (a.sequence || 0))[0];

      if (latestActivePlan) {
        setStatusValue(latestActivePlan.planName || t('job_status', language));
      } else {
        setStatusValue(t('job_status', language));
      }
    } else {
      console.error("Error fetching data:", jobsResponse);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  // Save planmaster detail
  const handleSavePlanDetail = async (planId: string) => {
    if (!planId) return;

    try {
      setSavingPlanDetail(true);

      // Find the specific plan's form elements
      const planSection = document.getElementById(`plan-${planId}`) || document.querySelector(`[data-plan-id="${planId}"]`);

      // If we can't find the plan section, try to get inputs directly
      const detailInput = planSection ?
        planSection.querySelector('textarea[name="detail"]') as HTMLInputElement :
        document.querySelector(`textarea[name="detail"][data-plan-id="${planId}"]`) as HTMLInputElement;

      const dateInput = planSection ?
        planSection.querySelector('input[name="detailDate"]') as HTMLInputElement :
        document.querySelector(`input[name="detailDate"][data-plan-id="${planId}"]`) as HTMLInputElement;

      const sequenceInput = planSection ?
        planSection.querySelector('input[name="sequence"]') as HTMLInputElement :
        document.querySelector(`input[name="sequence"][data-plan-id="${planId}"]`) as HTMLInputElement;

      // Validate required fields
      if (!detailInput?.value) {
        setToast({ show: true, message: 'กรุณาระบุรายละเอียด', type: 'error' });
        detailInput?.focus();
        setSavingPlanDetail(false);
        return;
      }

      if (!dateInput?.value) {
        setToast({ show: true, message: 'กรุณาระบุวันที่', type: 'error' });
        dateInput?.focus();
        setSavingPlanDetail(false);
        return;
      }

      if (!sequenceInput?.value) {
        setToast({ show: true, message: 'กรุณาระบุลำดับ', type: 'error' });
        sequenceInput?.focus();
        setSavingPlanDetail(false);
        return;
      }

      const detail = detailInput.value;
      const detailDate = dateInput.value ? `${dateInput.value}T00:00:00Z` : '';
      const sequence = parseInt(sequenceInput.value || '0', 10);

      setToast({ show: true, message: 'กำลังบันทึกข้อมูล...', type: 'success' });

      // Call the API to update planmaster detail
      const response = await api.put(`planmaster/${planId}/detail`, {
        detail: detail,
        detailDate: detailDate,
        sequence: sequence
      });

      if (Number(response.status) === 200) {
        // Update the local state to reflect changes
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            if (plan.id === planId) {
              return {
                ...plan,
                detail: detail,
                detailDate: detailDate,
                sequence: sequence
              };
            }
            return plan;
          });
        });

        // Close the edit form
        setExpandedActivities(prev => ({
          ...prev,
          [planId + '_edit']: false
        }));

        // Show success toast
        setToast({ show: true, message: 'บันทึกข้อมูลรายละเอียดเรียบร้อยแล้ว', type: 'success' });
      }
    } catch (err) {
      console.error('Error saving plan detail:', err);
      setError('ไม่สามารถบันทึกข้อมูลรายละเอียดได้ กรุณาลองใหม่อีกครั้ง');
      setToast({ show: true, message: 'ไม่สามารถบันทึกข้อมูลรายละเอียดได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    } finally {
      setSavingPlanDetail(false);
    }
  };

  // Add a new plan
  const handleAddPlan = async (plan: PlanMaster | null) => {
    if (!plan) return;

    try {
      let response: any;
      response = await api.post(`planmaster/add`, {
        mapUserJobId: plan.mapUserJobId,
        planName: 'แผนใหม่',
        status: false,
        sequence: (plan.sequence || 0) + 1 // Default high sequence number
      });

      if (response.code === 201 && response.status === "Created") {
        // Show success toast
        setToast({ show: true, message: 'เพิ่มแผนใหม่เรียบร้อยแล้ว', type: 'success' });

        try {
          await fetchPlanmaster();
        } catch (fetchErr) {
          console.error('Error fetching updated planmaster data:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Error adding new plan:', err);
      setToast({ show: true, message: 'ไม่สามารถเพิ่มแผนใหม่ได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    }
  };

  // Show confirmation dialog for deleting a plan
  const showDeleteConfirmation = (planId: string) => {
    setConfirmDialog({
      show: true,
      planId,
      title: 'ยืนยันการลบแผน', // Confirm deletion
      message: 'คุณต้องการลบแผนนี้หรือไม่? การลบแผนจะไม่สามารถกู้คืนได้' // Do you want to delete this plan? This action cannot be undone.
    });
  };

  // Handle actual deletion after confirmation
  const handleDeletePlan = async (planId: string) => {
    try {
      const response = await api.delete(`planmaster/${planId}`);
      if (response.code === 200 && response.status === "OK") {
        await fetchPlanmaster();
        setToast({ show: true, message: 'ลบแผนเรียบร้อยแล้ว', type: 'success' });
      } else {
        setToast({ show: true, message: 'ไม่สามารถลบแผนได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setToast({ show: true, message: 'เกิดข้อผิดพลาดในการลบแผน กรุณาลองใหม่อีกครั้ง', type: 'error' });
    } finally {
      // Close the confirmation dialog
      setConfirmDialog({ ...confirmDialog, show: false });
    }
  }

  // Function to handle template file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, planId: string, templateId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Show loading toast
      setToast({ show: true, message: 'กำลังอัพโหลดไฟล์...', type: 'success' });

      // Call API to upload file using the new central API endpoint
      // Important: Do NOT set Content-Type header manually for FormData
      const response = await api.put<FileUploadResponse>(`planmaster/${templateId}/attractfile`, formData, {});


      if (response.code === 200 && response.status === "OK") {
        // Update the template in state with the new file URL
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            if (plan.id === planId) {
              return {
                ...plan,
                templates: plan.templates.map(template => {
                  if (template.id === templateId) {
                    return {
                      ...template,
                      attractFile: response.data.data.attractFile || '',
                      attractFileDate: response.data.data.attractFileDate || new Date().toISOString()
                    };
                  }
                  return template;
                })
              };
            }
            return plan;
          });
        });

        // Show success message
        setToast({ show: true, message: 'อัพโหลดไฟล์สำเร็จ', type: 'success' });
      } else {
        // Show error message
        setToast({ show: true, message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      // Show more detailed error message if available
      const errorMessage = error.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์';
      setToast({ show: true, message: errorMessage, type: 'error' });
    }
  };

  // Function to save template changes
  const handleSaveTemplate = async (planId: string, templateId: string, sequence: number | undefined) => {
    try {
      // Get values from form fields
      const sidInput = document.getElementById(`edit-sid-${templateId}`) as HTMLInputElement;
      const detailInput = document.getElementById(`edit-detail-${templateId}`) as HTMLInputElement;
      const dateInput = document.getElementById(`edit-date-${templateId}`) as HTMLInputElement;

      if (!sidInput || !detailInput || !dateInput) {
        setToast({ show: true, message: 'ไม่พบข้อมูลฟอร์ม กรุณาลองใหม่อีกครั้ง', type: 'error' });
        return;
      }

      // Validate SID (must be a valid number)
      if (!sidInput.value.trim()) {
        setToast({ show: true, message: 'กรุณาระบุลำดับ', type: 'error' });
        sidInput.focus();
        return;
      }

      const sidValue = sidInput.value.trim();
      if (isNaN(Number(sidValue))) {
        setToast({ show: true, message: 'ลำดับต้องเป็นตัวเลขเท่านั้น', type: 'error' });
        sidInput.focus();
        return;
      }

      // Validate detail (required)
      if (!detailInput.value.trim()) {
        setToast({ show: true, message: 'กรุณาระบุรายละเอียด', type: 'error' });
        detailInput.focus();
        return;
      }

      // Validate date format if provided
      if (dateInput.value && isNaN(Date.parse(dateInput.value))) {
        setToast({ show: true, message: 'รูปแบบวันที่ไม่ถูกต้อง', type: 'error' });
        dateInput.focus();
        return;
      }

      if (!dateInput.value) {
        setToast({ show: true, message: 'กรุณาระบุวันที่', type: 'error' });
        dateInput.focus();
        return;
      }

      const sid = parseInt(sidValue);
      const detail = detailInput.value.trim();
      const detailDate = dateInput.value ? new Date(dateInput.value).toISOString() : '';

      // Show loading toast
      setToast({ show: true, message: 'กำลังบันทึกข้อมูล...', type: 'success' });

      // Call API to update template
      const response = await api.put(`planmaster/${templateId}/detail`, {
        sequence: sequence,
        sid: sid.toString(),
        detail: detail,
        detailDate: detailDate
      });

      if (response.code === 200 && response.status === "OK") {
        // Update the template in state
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            if (plan.id === planId) {
              return {
                ...plan,
                templates: plan.templates.map(template => {
                  if (template.id === templateId) {
                    return {
                      ...template,
                      sid,
                      detail,
                      detailDate
                    };
                  }
                  return template;
                })
              };
            }
            return plan;
          });
        });

        // Exit edit mode
        setEditingTemplateId(null);

        // Show success message
        setToast({ show: true, message: 'บันทึกข้อมูลสำเร็จ', type: 'success' });
      } else {
        // Show error message
        setToast({ show: true, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setToast({ show: true, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
    }
  };

  const fetchPlanmaster = async () => {
    if (applicant && applicant.id) {
      const planmastersResponse = await getPlanmasterById(applicant.id);
      if (planmastersResponse.code === 200 && planmastersResponse.status === "OK") {
        // อัปเดตข้อมูล planmaster ในแอป
        const planmasterData = typeof planmastersResponse.data === 'string' ?
          JSON.parse(planmastersResponse.data) : planmastersResponse.data;
        setPlanmasters(planmasterData);
      }
    }
  }

  // Toggle plan status (approve/reject)
  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    if (!planId) return;

    try {
      // Show loading toast
      let adminUserId = null;
      const adminUserData = localStorage.getItem('jobyamUserAdmin');
    
      if (adminUserData) {
        const adminUser = JSON.parse(adminUserData);
        adminUserId = adminUser.id;
      }
    
      // Call API to update plan status
      const response = await api.put(`status/planmaster/${planId}`, {
        status: !currentStatus,
        assigned: adminUserId
      });

      if (response.code === 200 && response.status === "OK") {
        // Update the local state to reflect changes
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            if (plan.id === planId) {
              return {
                ...plan,
                status: !currentStatus
              };
            }
            return plan;
          });
        });

        handleStatusChange(applicant?.id || '');

        // Show success toast
        const message = !currentStatus ? 'อนุมัติแผนเรียบร้อยแล้ว' : 'ยกเลิกแผนเรียบร้อยแล้ว';
        setToast({ show: true, message, type: 'success' });
      }
    } catch (err) {
      console.error('Error toggling plan status:', err);
      setToast({ show: true, message: 'ไม่สามารถเปลี่ยนสถานะแผนได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    }
  };

  // Handle file attachment submission
  const handleAddFileAttachment = async () => {
    if (!fileAttachmentPopup.plan) return;

    // Validate required fields
    const errors = {
      detail: !fileAttachmentForm.detail.trim(),
      subDetail: !fileAttachmentForm.subDetail.trim(),
      detailDate: !fileAttachmentForm.detailDate
    };

    setFormErrors(errors);

    // Check if any required field is empty
    if (errors.detail || errors.subDetail || errors.detailDate) {
      setToast({
        show: true,
        message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
        type: 'error'
      });
      return;
    }

    try {
      const response = await api.post(`planmaster/add/sub`, {
        mapUserJobId: fileAttachmentPopup.plan.mapUserJobId,
        templateMasterId: fileAttachmentPopup.plan.templateMasterId,
        detail: fileAttachmentForm.detail,
        subDetail: fileAttachmentForm.subDetail,
        attractFile: fileAttachmentForm.attractFile,
        detailDate: new Date(fileAttachmentForm.detailDate).toISOString()
      });

      if ((response.code === 200 && response.status === "OK") || (response.code === 201 && response.status === "Created")) {
        // Show success toast
        setToast({ show: true, message: 'เพิ่มไฟล์แนบเรียบร้อยแล้ว', type: 'success' });

        // Reset form and close popup
        setFileAttachmentForm({
          detail: '',
          subDetail: '',
          attractFile: '',
          detailDate: new Date().toISOString().split('T')[0]
        });
        setFileAttachmentPopup({ show: false, plan: null });

        // Refresh data
        try {
          await fetchPlanmaster();
        } catch (fetchErr) {
          console.error('Error fetching updated planmaster data:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Error adding file attachment:', err);
      setToast({ show: true, message: 'ไม่สามารถเพิ่มไฟล์แนบได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    }
  };

  // Toggle template status (approve/reject)
  const handleToggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    if (!templateId) return;

    try {
      // Show loading toast
      setToast({ show: true, message: 'กำลังบันทึกข้อมูล...', type: 'success' });

      let adminUserId = null;
      const adminUserData = localStorage.getItem('jobyamUserAdmin');
    
      if (adminUserData) {
        const adminUser = JSON.parse(adminUserData);
        adminUserId = adminUser.id;
      }
    
      // Call API to update template status
      const response = await api.put(`status/planmaster/${templateId}`, {
        status: !currentStatus,
        assigned: adminUserId
      });

      if (response.code === 200 && response.status === "OK") {
        // Update the template in state with the new status
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            return {
              ...plan,
              templates: plan.templates.map(template => {
                if (template.id === templateId) {
                  return {
                    ...template,
                    status: !currentStatus
                  };
                }
                return template;
              })
            };
          });
        });
        handleStatusChange(applicant?.id || '');

        // Show success message
        const message = !currentStatus ? 'อนุมัติเอกสารเรียบร้อยแล้ว' : 'ยกเลิกเอกสารเรียบร้อยแล้ว';
        setToast({ show: true, message, type: 'success' });
      } else {
        // Show error message
        setToast({ show: true, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
      setToast({ show: true, message: 'ไม่สามารถเปลี่ยนสถานะเอกสารได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    }
  };

  // Save edited plan name
  const handleSavePlanName = async (planId: string) => {
    if (!planId) return;
    if (planId === "00000000-0000-0000-0000-000000000000") {
      setEditingPlanId("");
      return;
    }

    try {
      // Call API to update plan name
      const response = await api.put(`planmaster/${planId}/name`, {
        planName: editingPlanName
      });

      if (response.code === 200 && response.status === "OK") {
        // Update the local state to reflect changes
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            if (plan.id === planId) {
              return {
                ...plan,
                planName: editingPlanName
              };
            }
            return plan;
          });
        });

        // Show success toast
        setToast({ show: true, message: 'บันทึกชื่อแผนเรียบร้อยแล้ว', type: 'success' });
      }
    } catch (err) {
      console.error('Error saving plan name:', err);
      setToast({ show: true, message: 'ไม่สามารถบันทึกชื่อแผนได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    } finally {
      // Exit edit mode
      setEditingPlanId(null);
    }
  };

  // Function to delete document file
  const handleDeleteFile = async (templateId: string) => {
    try {
      setToast({ show: true, message: 'กำลังลบไฟล์...', type: 'success' });

      // Call API to delete file
      const response = await api.delete(`planmaster/${templateId}/attractfile`);

      if (response.code === 200 && response.status === "OK") {
        // Update the local state to reflect changes
        setPlanmasters(prevPlans => {
          return prevPlans.map(plan => {
            // Find the plan containing this template
            const updatedTemplates = plan.templates.map(template => {
              if (template.id === templateId) {
                return {
                  ...template,
                  attractFile: '',
                  attractFileDate: ''
                };
              }
              return template;
            });

            return {
              ...plan,
              templates: updatedTemplates
            };
          });
        });

        // Show success toast
        setToast({ show: true, message: 'ลบไฟล์เรียบร้อยแล้ว', type: 'success' });
      } else {
        setToast({ show: true, message: 'ไม่สามารถลบไฟล์ได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setToast({ show: true, message: 'ไม่สามารถลบไฟล์ได้ กรุณาลองใหม่อีกครั้ง', type: 'error' });
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadAll = async () => {
    // Calculate total number of files first
    const totalFiles = planmasters.reduce((total, plan) => total + plan.templates.filter(t => t.attractFile).length, 0);
    let currentFile = 0;

    // Create a loading toast
    setToast({ show: true, message: t('saving', language), type: 'success' });

    let downloadedFiles = [];
    // Process each planmaster and download files
    for (let i = 0; i < planmasters.length; i++) {
      const plan = planmasters[i];
      for (let j = 0; j < plan.templates.length; j++) {
        const template = plan.templates[j];
        if (template.attractFile) {
          downloadedFiles.push(template);
        }
      }
    }

    if (downloadedFiles.length > 0) {
      for (let index = 0; index < downloadedFiles.length; index++) {
        const element = downloadedFiles[index];
        // Use backend proxy endpoint
        const response = await fetch(`${API_URL}s3/download/${encodeURIComponent(element.attractFile)}`);
        if (!response.ok) {
          throw new Error('Failed to download file');
        }
        const blob = await response.blob();

        // Create a hidden anchor link
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = URL.createObjectURL(blob);
        link.download = element.nameAttractFile;

        // Add to body and trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        // Update progress
        currentFile++;
        const progress = (currentFile / totalFiles) * 100;
        setToast({ show: true, message: `${t('downloading', language)} ${Math.round(progress)}%`, type: 'success' });

        // Wait a bit between downloads to ensure they complete
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      setToast({ show: true, message: 'ไม่พบไฟล์ที่ต้องการดาวน์โหลด', type: 'error' });
    }

    // Show completion message
    // setToast({ show: true, message: t('download_complete', language), type: 'success' });
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="w-full">
            <div className="animate-pulse flex flex-col space-y-6">
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="w-full">
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="text-center text-red-500">
                <p>{error}</p>
                <button
                  className="mt-4 px-4 cursor-pointer py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700"
                  onClick={() => navigate(`/applicants/${applicant?.id}`)}
                >
                  {t('back', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Add animation styles */}
      <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 h-full overflow-x-hidden">
        <div className="w-full">
          {/* Breadcrumbs */}
          <nav className="mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-xl shadow-sm border border-white/50 overflow-x-auto">
            <ol className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              <li>
                <span
                  className="hover:text-teal-600 transition-colors duration-200 flex items-center cursor-pointer"
                  onClick={() => navigate('/applicants')}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {t('applicants_list', language)}
                </span>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span
                  className="hover:text-teal-600 transition-colors duration-200 flex items-center cursor-pointer"
                  onClick={() => applicant?.id && navigate(`/applicants/${applicant.id}`)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {applicant?.name}
                </span>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-teal-700 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('job_status', language)}
                </span>
              </li>
            </ol>
          </nav>

          {/* Main content */}
          <div className="w-full bg-white/90 backdrop-filter backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-white/50">
            <div className="p-4 sm:p-6 md:p-8 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3 sm:mb-0">{t('job_status', language)}</h1>
                <button
                  onClick={() => navigate(`/applicants/${applicant?.id}`)}
                  className="self-start sm:self-auto flex cursor-pointer items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-300 group text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t('back', language)}
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                {/* Left column: Applicant info, Job info, and Status */}
                <div className="w-full lg:w-1/3">
                  <div className="bg-white/90 backdrop-filter backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-teal-500/10 to-blue-500/10">
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t('applicant_details', language)}
                      </h2>
                    </div>

                    <div className="p-5 border-b border-gray-100">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-blue-600 text-sm">{t('phone', language)}</h3>
                            <p className="text-gray-700 font-medium">{applicant?.phone || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-3 mt-0.5">
                            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-teal-600 text-sm">{t('name', language)}</h3>
                            <p className="text-gray-700 font-medium">{applicant?.name || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-purple-600 text-sm">{t('birthday', language)}</h3>
                            <p className="text-gray-700 font-medium">{applicant?.age ? `${applicant.age} ปี (${formatDate(applicant?.birthDay)})` : '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border-b border-gray-100">
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl">
                          <h3 className="font-medium text-blue-600 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {job?.job}
                          </h3>
                          <p className="text-gray-700 mb-2">{job?.jobTypeName}</p>
                          <div className="flex items-center space-x-2 bg-white/80 p-2 rounded-lg">
                            <span className="inline-block bg-green-100 p-1 rounded-full">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            <span className="text-green-700 font-medium">{job?.jobSalary}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('latest_status', language)}
                      </h3>
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${statusValue === 'สมัครใหม่'
                        ? 'bg-gray-100 text-gray-800 border border-gray-200'
                        : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                        }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${statusValue === 'สมัครใหม่' ? 'bg-gray-400' : 'bg-white'}`}></span>
                        {statusValue}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: Status form */}
                <div className="w-full">

                  <div className="bg-white/90 backdrop-filter backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-teal-500/10 to-blue-500/10">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="text-lg font-semibold text-gray-800">{t('latest_status', language)}</h3>
                        </div>
                        <button
                          onClick={handleDownloadAll}
                          className="bg-teal-600 cursor-pointer text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2"
                          title={t('download_all', language)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {t('download_all', language)}
                        </button>
                      </div>
                    </div>

                    {/* Timeline tree */}
                    <div className="relative pl-5 sm:pl-8 md:pl-10 mt-6 sm:mt-8">
                      {/* Timeline items */}
                      {Array.isArray(planmasters) && planmasters.length > 0 ? (
                        planmasters.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)).map((plan, index) => (
                          <div key={index} className="mb-3 sm:mb-4 md:mb-10 relative group">
                            {index !== planmasters.length - 1 && (
                              <div
                                className={`absolute left-2.5 sm:left-0 md:left-0 top-[17px] w-0.5 sm:w-1 md:w-1 h-[calc(200%-10px)] transition-all duration-100 ${plan.status ? "bg-green-400" : "bg-red-400"
                                  } group-hover:h-[calc(100%+12px)]`}
                              />
                            )}
                            {/* Circle indicator */}
                            <div className={`absolute left-0 sm:-left-4.5 md:-left-4.5 top-0 w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-110 ${plan.status
                              ? 'bg-gradient-to-br from-green-500 to-green-500 text-white shadow-md sm:shadow-lg shadow-green-200/50 border-2 border-white'
                              : 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-md sm:shadow-lg shadow-red-200/50 border-2 border-white'
                              }`}>
                              {plan.status ? (
                                <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>

                            {/* Content */}
                            <div className="ml-4 sm:ml-6 md:ml-10">
                              <div className="bg-white/90 backdrop-filter backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm sm:shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-4 md:p-5 border border-gray-100/80 group-hover:border-teal-100 overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 flex-wrap">
                                  <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                                    {editingPlanId === plan.id ? (
                                      <input
                                        type="text"
                                        className="px-3 py-1.5 rounded-lg text-sm border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200"
                                        value={editingPlanName}
                                        onChange={(e) => setEditingPlanName(e.target.value)}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${plan.status
                                          ? 'bg-green-50 text-green-700 border border-green-200'
                                          : 'bg-red-50 text-red-700 border border-red-200'
                                          }`}
                                      >
                                        {plan.planName || t('no_plan_name', language)}
                                      </span>
                                    )}
                                    <button
                                      className="inline-flex cursor-pointer items-center justify-center w-8 h-8 text-sm font-medium border border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                                      onClick={() => {
                                        if (editingPlanId === plan.id) {
                                          // Save the edited plan name
                                          handleSavePlanName(plan.id || '');
                                        } else {
                                          // Start editing this plan
                                          setEditingPlanId(plan.id || '');
                                          setEditingPlanName(plan.planName || '');
                                        }
                                      }}
                                    >
                                      {editingPlanId === plan.id ? '💾' : '✏️'}
                                    </button>
                                    <button
                                      className="inline-flex cursor-pointer items-center justify-center w-8 h-8 text-sm font-medium border border-teal-500 text-teal-700 bg-teal-50 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 rounded-full"
                                      onClick={() => handleAddPlan(plan)}
                                      title={t('add_new_plan', language)}
                                    >
                                      ➕
                                    </button>
                                    <button
                                      className="inline-flex cursor-pointer items-center justify-center w-8 h-8 text-sm font-medium border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full"
                                      onClick={() => showDeleteConfirmation(plan.id || '')}
                                      title={t('delete_plan', language)}
                                    >
                                      🗑️
                                    </button>
                                    <button
                                      className="inline-flex cursor-pointer items-center justify-center px-3 h-8 text-sm font-medium border border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                                      onClick={() => setFileAttachmentPopup({ show: true, plan: plan })}
                                      title={t('add_file_attachment', language)}
                                    >
                                      <span className="mr-1">🔄</span> {t('add_file_attachment', language)}
                                    </button>
                                  </div>

                                  <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                                    {plan.templates && plan.templates.length >= 1 ? (
                                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${plan.status
                                        ? 'text-green-700 bg-green-50'
                                        : 'text-red-700 bg-red-50'
                                        }`}>
                                        {plan.status ? t('done', language) : t('waiting', language)}
                                      </span>
                                    ) : (
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="sr-only peer"
                                          checked={plan.status}
                                          onChange={() => handleToggleStatus(plan.id || '', plan.status)}
                                        />
                                        <label className="relative inline-flex items-center cursor-pointer w-22 h-8">
                                          <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={plan.status}
                                            onChange={() => handleToggleStatus(plan.id || '', plan.status)}
                                          />
                                          <div className="w-full h-full bg-red-500 peer-checked:bg-green-500 rounded-full transition-all flex items-center justify-end peer-checked:justify-start px-4 text-xs font-medium text-white select-none">
                                            {plan.status ? t('done', language) : t('waiting', language)}
                                          </div>
                                          <div className="absolute left-0.5 top-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-13"></div>
                                        </label>
                                      </label>
                                    )}
                                    <button
                                      className="text-sm cursor-pointer text-gray-600 hover:text-blue-600 flex items-center transition-colors duration-200"
                                      onClick={() => {
                                        const planSequence = plan.sequence || '';
                                        setExpandedActivities(prev => ({
                                          ...prev,
                                          [planSequence + '_edit']: !prev[planSequence + '_edit']
                                        }));
                                      }}
                                    >
                                      <svg className="w-4 h-4 mr-1 transition-transform duration-300"
                                        style={{ transform: expandedActivities[plan.sequence + '_edit'] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                      </svg>
                                      {expandedActivities[plan.sequence + '_edit'] ? t('hide', language) : t('show', language)}
                                    </button>
                                  </div>
                                </div>

                                {plan.sequence && expandedActivities[plan.sequence + '_edit'] && (
                                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-hidden" id={`plan-${plan.id}`} data-plan-id={plan.id}>
                                    {plan.templates.length <= 0 && (
                                      <>
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                          <label className="text-sm text-gray-600 w-full md:w-24">{t('detail', language)}: <span className="text-red-500">*</span></label>
                                          <textarea
                                            rows={3}
                                            name="detail"
                                            data-plan-id={plan.id}
                                            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 resize-none whitespace-pre-wrap break-words"
                                            defaultValue={plan.detail || ''}
                                            placeholder={t('detail', language)}
                                            aria-label={t('detail', language)}
                                            required
                                          />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                          <label className="text-sm text-gray-600 w-full md:w-24">{t('date', language)}: <span className="text-red-500">*</span></label>
                                          <div className="flex flex-col sm:flex-row w-full gap-2">
                                            <div className="flex-1">
                                              <input
                                                type="date"
                                                name="detailDate"
                                                data-plan-id={plan.id}
                                                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200"
                                                defaultValue={plan.detailDate ? plan.detailDate.split('T')[0] : ''}
                                                required />
                                            </div>
                                            <div className="flex-1">
                                              <input
                                                type="text"
                                                name="sequence"
                                                data-plan-id={plan.id}
                                                placeholder={t('sequence', language)}
                                                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200"
                                                defaultValue={plan.sequence || ''}
                                                required />
                                            </div>

                                            <button
                                              type="button"
                                              className="w-full sm:w-auto cursor-pointer px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg text-sm hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                              onClick={() => handleSavePlanDetail(plan.id || '')}
                                              disabled={savingPlanDetail}
                                            >
                                              {savingPlanDetail ? t('saving', language) : t('save', language)}
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {/* Templates section */}
                                    {plan.templates && plan.templates.length > 0 && (
                                      <div className="mt-2">
                                        <div className="mt-2 sm:mt-1 pl-3 sm:pl-4 md:pl-1 relative">
                                          {/* Document timeline list */}
                                          <ul className="space-y-8 sm:space-y-10 md:space-y-12">
                                            {plan.templates
                                              .sort((a, b) => a.sid - b.sid)
                                              .map((template) => (
                                                <li key={template.id} className="relative pl-6 sm:pl-8 md:pl-10">
                                                  <div className={`absolute left-2.5 sm:left-3 md:left-3 top-[10px] h-[calc(230%-10px)] w-0.5 ${template.status ? "bg-green-400" : "bg-red-400"} rounded-full`}></div>
                                                  <div className={`absolute left-0 sm:left-0 md:left-0 top-0 w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 rounded-full flex items-center justify-center ${template.status ? 'bg-green-500' : 'bg-red-500'} shadow-md z-10 border-2 border-white`}>
                                                    {template.status ? (
                                                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                      </svg>
                                                    ) : (
                                                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                    )}
                                                  </div>

                                                  {editingTemplateId === template.id ? (
                                                    // Edit mode
                                                    <div className="bg-white/90 backdrop-filter backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200 shadow-sm sm:shadow-md overflow-hidden">
                                                      <div className="flex items-center mb-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                          <span className="text-blue-600 font-medium text-sm">{template.sid}</span>
                                                        </div>
                                                        <h5 className="text-blue-800 font-medium">{template.subDetail}</h5>
                                                      </div>

                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('sequence', language)} <span className="text-red-500">*</span></label>
                                                          <input
                                                            type="number"
                                                            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200"
                                                            defaultValue={template.sid}
                                                            id={`edit-sid-${template.id}`}
                                                            min="1"
                                                            required
                                                          />
                                                        </div>

                                                        <div>
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('date', language)}</label>
                                                          <input
                                                            type="date"
                                                            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200"
                                                            defaultValue={template.detailDate ? template.detailDate.split('T')[0] : ''}
                                                            id={`edit-date-${template.id}`}
                                                          />
                                                        </div>
                                                      </div>

                                                      <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('detail', language)} <span className="text-red-500">*</span></label>
                                                        <textarea
                                                          rows={3}
                                                          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 resize-none"
                                                          defaultValue={template.detail}
                                                          id={`edit-detail-${template.id}`}
                                                          placeholder={t('detail', language)}
                                                          required
                                                        />
                                                      </div>

                                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                                                        <div className="flex justify-end w-full gap-2">
                                                          <button
                                                            type="button"
                                                            className="flex-1 sm:flex-none cursor-pointer px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center justify-center"
                                                            onClick={() => setEditingTemplateId(null)}
                                                          >
                                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            {t('cancel', language)}
                                                          </button>
                                                          <button
                                                            type="button"
                                                            className="flex-1 sm:flex-none cursor-pointer px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs sm:text-sm rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center"
                                                            onClick={() => handleSaveTemplate(plan.id || '', template.id, plan.sequence)}
                                                          >
                                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {t('save', language)}
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    // View mode
                                                    <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                                      <div className="flex items-center justify-between mb-2 flex-wrap gap-1 sm:gap-2">
                                                        <div className="flex items-center flex-wrap">
                                                          <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center mr-2 sm:mr-3">
                                                            <span className="text-gray-600 font-medium">{template.sid}</span>
                                                          </div>
                                                          <h5 className="text-gray-800 font-medium">{template.subDetail}</h5>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                          {/* <button
                                                            className={`inline-flex cursor-pointer items-center justify-center px-3 py-1 text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${template.status
                                                              ? 'border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                                                              : 'border border-green-500 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500'
                                                              }`}
                                                            onClick={() => handleToggleTemplateStatus(template.id || '', template.status)}
                                                            title={template.status ? t('waiting', language) : t('done', language)}
                                                          >
                                                            {template.status ? t('waiting', language) : t('done', language)}
                                                          </button> */}
                                                          <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                              type="checkbox"
                                                              className="sr-only peer"
                                                              checked={template.status}
                                                              onChange={() => handleToggleTemplateStatus(template.id || '', template.status)}
                                                            />
                                                            <label className="relative inline-flex items-center cursor-pointer w-22 h-8">
                                                              <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={template.status}
                                                                onChange={() => handleToggleTemplateStatus(template.id || '', template.status)}
                                                              />
                                                              <div className="w-full h-full bg-red-500 peer-checked:bg-green-500 rounded-full transition-all flex items-center justify-end peer-checked:justify-start px-4 text-xs font-medium text-white select-none">
                                                                {template.status ? t('done', language) : t('waiting', language)}
                                                              </div>
                                                              <div className="absolute left-0.5 top-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-13"></div>
                                                            </label>
                                                          </label>
                                                          <button
                                                            type="button"
                                                            className="inline-flex cursor-pointer items-center justify-center w-8 h-8 text-sm font-medium border border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                                                            onClick={() => setEditingTemplateId(template.id)}
                                                          >
                                                            ✏️
                                                          </button>
                                                          <button
                                                            className="inline-flex cursor-pointer items-center justify-center w-8 h-8 text-sm font-medium border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full"
                                                            onClick={() => showDeleteConfirmation(template.id || '')}
                                                            title={t('delete', language)}
                                                          >
                                                            🗑️
                                                          </button>
                                                        </div>
                                                      </div>

                                                      <div className="pl-8 sm:pl-11 space-y-2 overflow-hidden">
                                                        {template.detail && (
                                                          <div className="flex items-start">
                                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center mr-2">
                                                              <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                              </svg>
                                                            </div>
                                                            <div>
                                                              <p className="text-sm text-gray-600 whitespace-pre-line break-words line-clamp-3 overflow-hidden">
                                                                {template.detail}
                                                              </p>
                                                            </div>
                                                          </div>
                                                        )}

                                                        {template.detailDate && (
                                                          <div className="flex items-start">
                                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center mr-2">
                                                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                              </svg>
                                                            </div>
                                                            <div>
                                                              <p className="text-sm text-gray-600">{template.detailDate ? new Date(template.detailDate).toLocaleDateString('th-TH') : '-'}</p>
                                                            </div>
                                                          </div>
                                                        )}

                                                        <div className="flex items-start">
                                                          {/* <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mr-2">
                                                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                          </div> */}
                                                          <div>
                                                            {template.attractFile ? (
                                                              <div className="flex items-center">
                                                                <button
                                                                  type="button"
                                                                  onClick={async () => {
                                                                    try {
                                                                      // Use backend proxy endpoint
                                                                      const response = await fetch(`${API_URL}s3/download/${encodeURIComponent(template.attractFile)}`);

                                                                      if (!response.ok) {
                                                                        throw new Error('Failed to download file');
                                                                      }
                                                                      const blob = await response.blob();

                                                                      // Create a hidden anchor link
                                                                      const link = document.createElement('a');
                                                                      link.style.display = 'none';
                                                                      link.href = URL.createObjectURL(blob);
                                                                      link.download = template.nameAttractFile;

                                                                      // Add to body and trigger download
                                                                      document.body.appendChild(link);
                                                                      link.click();

                                                                      // Clean up
                                                                      document.body.removeChild(link);
                                                                      URL.revokeObjectURL(link.href);
                                                                    } catch (error: any) {
                                                                      console.error('Download error:', error);
                                                                      setToast({ show: true, message: 'ไม่สามารถดาวน์โหลดไฟล์ได้', type: 'error' });
                                                                    }
                                                                  }}
                                                                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm break-all cursor-pointer"
                                                                >
                                                                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                  </svg>
                                                                  <span className="truncate">{t('download', language)}</span>
                                                                </button>
                                                                <button
                                                                  type="button"
                                                                  onClick={async () => {
                                                                    try {
                                                                      // Use backend proxy endpoint
                                                                      const response = await fetch(`${API_URL}s3/download/${encodeURIComponent(template.attractFile)}`);

                                                                      if (!response.ok) {
                                                                        throw new Error('Failed to open file');
                                                                      }
                                                                      const blob = await response.blob();
                                                                      const url = URL.createObjectURL(blob);
                                                                      window.open(url, '_blank');
                                                                      URL.revokeObjectURL(url);
                                                                    } catch (error: any) {
                                                                      console.error('Preview error:', error);
                                                                      setToast({ show: true, message: 'ไม่สามารถเปิดดูไฟล์ได้', type: 'error' });
                                                                    }
                                                                  }}
                                                                  className="text-blue-600 hover:text-blue-800 ml-3 flex items-center text-sm break-all cursor-pointer"
                                                                >
                                                                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                  </svg>
                                                                  <span className="truncate">{t('preview', language)}</span>
                                                                </button>
                                                                {/* <button
                                                                  type="button"
                                                                  onClick={() => handleDeleteFile(template.id)}
                                                                  className="text-red-600 hover:text-red-800 flex items-center text-sm break-all cursor-pointer ml-3"
                                                                >
                                                                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                  </svg>
                                                                  <span className="truncate">{t('delete', language)}</span>
                                                                </button> */}
                                                              </div>
                                                            ) : (
                                                              <div className="flex items-center gap-3">
                                                                {/* <input
                                                                  type="file"
                                                                  id={`file-upload-view-${template.id}`}
                                                                  className="hidden"
                                                                  onChange={(e) => handleFileUpload(e, plan.id || '', template.id)}
                                                                />

                                                                <label
                                                                  htmlFor={`file-upload-view-${template.id}`}
                                                                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm break-all cursor-pointer ml-3"
                                                                >
                                                                  <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                  </svg>
                                                                  {t('upload', language)}
                                                                </label> */}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">{t('noData', language)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* File attachment popup with blurred background */}
      {fileAttachmentPopup.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Animated blurred background overlay with gradient */}
          <div className="fixed inset-0 backdrop-filter backdrop-blur-sm bg-gradient-to-br from-teal-500/20 to-blue-500/20 animate-gradient-shift"></div>

          {/* Floating bubbles animation in background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>
            <div className="bubble bubble-4"></div>
            <div className="bubble bubble-5"></div>
          </div>

          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 relative z-10">
            {/* Center modal properly */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel with glass effect and animation */}
            <div className="inline-block align-bottom bg-white/80 backdrop-filter backdrop-blur-md rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-500 ease-in-out sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/50 animate-modal-entry">
              {/* Decorative top gradient bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-blue-500 to-teal-400 animate-gradient-x"></div>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-lg sm:mx-0 sm:h-14 sm:w-14 transform hover:scale-110 transition-transform duration-300 animate-pulse-subtle">
                    {/* Animated file icon */}
                    <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl leading-6 font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent" id="modal-title">
                      {t('add_attachment', language)}
                    </h3>
                    <div className="mt-4 space-y-4">
                      {/* Sub Detail */}
                      <div>
                        <label htmlFor="subDetail" className="block text-sm font-medium text-gray-700">
                          {t('sub_detail', language)}<span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            id="subDetail"
                            className={`mt-1 block w-full border ${formErrors.subDetail ? 'border-red-500 bg-red-50' : 'border-gray-300 group-hover:border-teal-300'} rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 ease-in-out sm:text-sm`}
                            value={fileAttachmentForm.subDetail}
                            onChange={(e) => {
                              setFileAttachmentForm({ ...fileAttachmentForm, subDetail: e.target.value });
                              if (e.target.value.trim()) {
                                setFormErrors({ ...formErrors, subDetail: false });
                              }
                            }}
                            placeholder={t('sub_detail', language)}
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className={`${fileAttachmentForm.subDetail ? 'text-teal-500' : 'text-gray-400'} transition-colors duration-300`}>✓</span>
                          </div>
                        </div>
                        {formErrors.subDetail && (
                          <p className="mt-1 text-sm text-red-600">{t('sub_detail_required', language)}</p>
                        )}
                      </div>

                      {/* Detail */}
                      <div>
                        <label htmlFor="detail" className="block text-sm font-medium text-gray-700">
                          {t('detail', language)} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <textarea
                            id="detail"
                            rows={3}
                            className={`mt-1 block w-full border ${formErrors.detail ? 'border-red-500 bg-red-50' : 'border-gray-300 group-hover:border-teal-300'} rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 ease-in-out sm:text-sm`}
                            value={fileAttachmentForm.detail}
                            onChange={(e) => {
                              setFileAttachmentForm({ ...fileAttachmentForm, detail: e.target.value });
                              if (e.target.value.trim()) {
                                setFormErrors({ ...formErrors, detail: false });
                              }
                            }}
                            placeholder="รายละเอียดของแผนงาน"
                            required
                          />
                          <div className="absolute bottom-3 right-0 flex items-center pr-3 pointer-events-none">
                            <span className={`${fileAttachmentForm.detail ? 'text-teal-500' : 'text-gray-400'} transition-colors duration-300`}>✓</span>
                          </div>
                        </div>
                        {formErrors.detail && (
                          <p className="mt-1 text-sm text-red-600">{t('detail_required', language)}</p>
                        )}
                      </div>

                      {/* Detail Date */}
                      <div>
                        <label htmlFor="detailDate" className="block text-sm font-medium text-gray-700">
                          {t('date', language)} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <input
                            type="date"
                            id="detailDate"
                            className={`mt-1 block w-full border ${formErrors.detailDate ? 'border-red-500 bg-red-50' : 'border-gray-300 group-hover:border-teal-300'} rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 ease-in-out sm:text-sm`}
                            value={fileAttachmentForm.detailDate}
                            onChange={(e) => {
                              setFileAttachmentForm({ ...fileAttachmentForm, detailDate: e.target.value });
                              if (e.target.value) {
                                setFormErrors({ ...formErrors, detailDate: false });
                              }
                            }}
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className={`${fileAttachmentForm.detailDate ? 'text-teal-500' : 'text-gray-400'} transition-colors duration-300`}>✓</span>
                          </div>
                        </div>
                        {formErrors.detailDate && (
                          <p className="mt-1 text-sm text-red-600">{t('detail_date_required', language)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="button"
                  className="w-full cursor-pointer inline-flex justify-center items-center rounded-lg border border-transparent shadow-lg px-5 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-base font-medium text-white hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3 sm:w-auto sm:text-sm transform hover:scale-105 transition-all duration-300 ease-in-out"
                  onClick={handleAddFileAttachment}
                >
                  <svg className="w-5 h-5 mr-2 animate-pulse-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {t('save', language)}
                </button>
                <button
                  type="button"
                  className="mt-3 cursor-pointer w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-md px-5 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transform hover:scale-105 transition-all duration-300 ease-in-out"
                  onClick={() => setFileAttachmentPopup({ show: false, plan: null })}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  {t('cancel', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful confirmation dialog with blurred background */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Blurred background overlay */}
          <div className="fixed inset-0 backdrop-filter backdrop-blur-sm bg-white/30"></div>

          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 relative z-10">
            {/* Center modal properly */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel with glass effect */}
            <div className="inline-block align-bottom bg-white/90 backdrop-filter backdrop-blur-md rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    {/* Warning icon */}
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {confirmDialog.title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmDialog.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full cursor-pointer inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleDeletePlan(confirmDialog.planId)}
                >
                  {t('confirm_delete', language)}
                </button>
                <button
                  type="button"
                  className="mt-3 cursor-pointer w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                >
                  {t('cancel', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
