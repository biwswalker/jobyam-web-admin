import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { type ApiResponse } from "../services/api";
import { motion } from "framer-motion";
import { useLanguage1 } from "../context/LanguageContext"; // Import your existing language hook
import { type Company, type JobType, type JobManpower, type ScoreData, type FormData, type MediaPreview } from "../model/jobs";

export function meta() {
  return [
    { title: "สร้างประกาศงานใหม่ - JobYam Admin" },
    { name: "description", content: "Create a new job posting" }
  ];
}


export default function CreateJob() {
  const { t, language1, setLanguage1 } = useLanguage1(); // Use your existing language hook
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileSizeError, setShowFileSizeError] = useState(false);
  const [titleMediaPreview, setTitleMediaPreview] =
    useState<MediaPreview | null>(null);
  const [imagePreview, setImagePreview] = useState<MediaPreview[]>([]);
  const [videoPreview, setVideoPreview] = useState<MediaPreview[]>([]);
  const [jobManpowerList, setJobManpowerList] = useState<JobManpower[]>([]);
  const [loadingJobManpower, setLoadingJobManpower] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loadingJobTypes, setLoadingJobTypes] = useState(false);
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [selectedScoreType, setSelectedScoreType] = useState<string>("notslide");
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [showEmptyManpowerModal, setShowEmptyManpowerModal] = useState<boolean>(false);
  const [showEmptyCompanyModal, setShowEmptyCompanyModal] = useState<boolean>(false);
  const [showEmptyJobTypesModal, setShowEmptyJobTypesModal] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [companyDisabled, setCompanyDisabled] = useState(false);
  const [jobManpowerDisabled, setJobManpowerDisabled] = useState(false);
  const titleMediaInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const videosInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    titleMedia: "",
    jobOwner: "",
    score: "",
    salaryStart: "",
    salaryEnd: "",
    workingHoursPerWeek: 0,
    // startDate: "จันทร์",
    // endDate: "ศุกร์",
    // timeStart: "13:00",
    // timeEnd: "17:00",
    description: "",
    qualifications: "",
    address: "",
    location: "",
    candidateCriteria: "",
    companyID: undefined,
    jobTypeID: undefined,
    jobManpowerID: undefined,
    acceptingPosition: 0,
    images: [],
    videos: []
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('jobyamUserAdmin');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserInfo(user);
          // You can adjust the property names as needed
          if (user.companyID && user.companyID !== "" && user.companyID !== null) {
            setFormData(prev => ({ ...prev, companyID: user.companyID }));
            setCompanyDisabled(true);
          }
          if (user.manpowerID && user.manpowerID !== "" && user.manpowerID !== null) {
            setFormData(prev => ({ ...prev, jobManpowerID: user.manpowerID }));
            setJobManpowerDisabled(true);
          }
        } catch { }
      }
    }
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const result = await api.get<ApiResponse<Company[]>>('jobs/company/select');
        if (result.code === 200 && result.status === 'OK' && Array.isArray(result.data)) {
          setCompanies(result.data);

          // Check if companies list is empty and show modal if needed
          if (result.data.length === 0) {
            setShowEmptyCompanyModal(true);
          }
        } else {
          setShowEmptyCompanyModal(true);
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setShowEmptyCompanyModal(true);
        console.error('Error fetching companies:', err);
        setError('ไม่สามารถโหลดข้อมูลบริษัทได้');
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchJobTypes = async () => {
      setLoadingJobTypes(true);
      try {
        const result = await api.get<ApiResponse<JobType[]>>('jobs/types/select');
        if (result.code === 200 && result.status === 'OK' && Array.isArray(result.data)) {
          setJobTypes(result.data);

          // Check if job types list is empty and show modal if needed
          if (result.data.length === 0) {
            setShowEmptyJobTypesModal(true);
          }
        } else {
          setShowEmptyJobTypesModal(true);
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setShowEmptyJobTypesModal(true);
        console.error('Error fetching job types:', err);
        setError('ไม่สามารถโหลดข้อมูลประเภทงานได้');
      } finally {
        setLoadingJobTypes(false);
      }
    };
    fetchJobTypes();
  }, []);

  useEffect(() => {
    const fetchJobManpower = async () => {
      setLoadingJobManpower(true);
      try {
        const result = await api.get<JobManpower[]>("jobmanpower/select");
        // Check if we have a valid response with data
        if (result.code === 200 && Array.isArray(result.data)) {
          // If data is a single object, wrap it in an array
          const manpowerList = result.data;
          setJobManpowerList(manpowerList);

          // Check if manpower list is empty and show modal if needed
          if (manpowerList && manpowerList.length === 0) {
            setShowEmptyManpowerModal(true);
          }
        } else {
          setShowEmptyManpowerModal(true);
          throw new Error("Invalid data format received from server");
        }
      } catch (err) {
        setShowEmptyManpowerModal(true);
        console.error("Error fetching job manpower:", err);
        setError("ไม่สามารถโหลดข้อมูล Job Manpower ได้");
      } finally {
        setLoadingJobManpower(false);
      }
    };
    fetchJobManpower();
  }, []);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const result = await api.get<ScoreData[]>("jobs/score");
        if (result.code === 200 && Array.isArray(result.data)) {
          setScores(result.data);
          // Set initial calculated score
          const initialScore = result.data.find((s) => s.RangeLabel === "slide")?.MaxScore || 20;
          const newScore = Number((initialScore + 0.01).toFixed(2));
          setCalculatedScore(newScore);
          setFormData(prev => ({
            ...prev,
            score: newScore.toString()
          }));
        }
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };
    fetchScores();
  }, []);

  const handleScoreTypeChange = (type: string) => {
    setSelectedScoreType(type);

    // Fix the parentheses issue in the conditional expression
    const selectedScore = scores.find((s) => s.RangeLabel === type)?.MaxScore || (type === "slide" ? 10 : 20);
    const newScore = Number((selectedScore + 0.01).toFixed(2));

    // Update the job score directly instead of using setFormData
    setFormData(prev => ({
      ...prev,
      score: newScore.toString()
    }));
  };

  const formatNumberWithCommas = (value: string): string => {
    if (!value) return '';

    if (!/^\d+$/.test(value)) {
      return value;
    }

    const num = parseInt(value, 10);

    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "acceptingPosition") {
      let numValue = parseInt(value);

      if (value.startsWith('0') && value.length > 1) {
        const trimmedValue = value.replace(/^0+/, '');
        e.target.value = trimmedValue;
        numValue = parseInt(trimmedValue);
      }

      if (!isNaN(numValue) && numValue > 0) {
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }));
      } else if (value === "") {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }));
      } else if (value === "0") {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }));
      }

    } else if (name === "salaryStart" || name === "salaryEnd") {
      let numericValue = value.replace(/,/g, '');

      if (numericValue.startsWith('0') && numericValue.length > 1) {
        numericValue = numericValue.replace(/^0+/, '');
      }

      if (numericValue === '' || /^\d+$/.test(numericValue)) {
        const formattedValue = formatNumberWithCommas(numericValue);

        setFormData((prev) => ({
          ...prev,
          [name]: formattedValue
        }));

        e.target.value = formattedValue;
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value
        }));
      }

    } else if (name === "workingHoursPerWeek") {
      const floatRegex = /^\d*\.?\d{0,2}$/;

      if (value === '' || floatRegex.test(value)) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          setFormData((prev) => ({
            ...prev,
            [name]: parsed,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [name]: 0,
          }));
        }
      }
    } else {
      setFormData((prev) => {
        if ((name === "companyID" || name === "manpowerID" || name === "jobTypeID") && value === "") {
          return { ...prev, [name]: undefined };
        }
        return { ...prev, [name]: value };
      });
    }
  };

  const handleTitleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        setError(t("create.errorInvalidFile"));
        return;
      }

      // Check max size for images: 500KB
      if (isImage && file.size > 500 * 1024) {
        setShowFileSizeError(true);
        return;
      }
      if (titleMediaInputRef.current) {
        titleMediaInputRef.current.value = '';
      }

      const url = URL.createObjectURL(file);
      setTitleMediaPreview({
        url,
        type: isImage ? "image" : "video",
        file
      });
      setFormData((prev) => ({
        ...prev,
        titleMedia: file.name
      }));
    }
  };

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      let hasLargeFile = false;
      const validImages = Array.from(files).filter((file) => {
        if (file.type.startsWith("image/")) {
          if (file.size > 500 * 1024) {
            hasLargeFile = true;
            return false;
          }
          return true;
        }
        return false;
      });

      if (hasLargeFile) {
        setShowFileSizeError(true);
        if (imagesInputRef.current) {
          imagesInputRef.current.value = '';
        }
      }

      if (validImages.length > 0) {
        const newPreviews = validImages.map((file) => ({
          url: URL.createObjectURL(file),
          type: "image" as const,
          file
        }));
        setImagePreview((prev) => [...prev, ...newPreviews]);
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...validImages]
        }));
      }
    },
    []
  );

  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newVideos = Array.from(files).filter((file) =>
        file.type.startsWith("video/")
      );
      if (newVideos.length > 0) {
        const newPreviews = newVideos.map((file) => ({
          url: URL.createObjectURL(file),
          type: "video" as const,
          file
        }));
        setVideoPreview((prev) => [...prev, ...newPreviews]);
        setFormData((prev) => ({
          ...prev,
          videos: [...prev.videos, ...newVideos]
        }));
      }
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    if (imagesInputRef.current) {
      imagesInputRef.current.value = '';
    }
  }, []);

  const removeVideo = useCallback((index: number) => {
    setVideoPreview((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));

    if (videosInputRef.current) {
      videosInputRef.current.value = '';
    }
  }, []);

  const removeTitleMedia = () => {
    if (titleMediaPreview) {
      URL.revokeObjectURL(titleMediaPreview.url);
    }
    setTitleMediaPreview(null);
    setFormData((prev) => ({
      ...prev,
      titleMedia: ""
    }));

    if (titleMediaInputRef.current) {
      titleMediaInputRef.current.value = '';
    }
  };

  const validateLocation = (location: string): boolean => {
    return /-?\d+\.\d+,\s*-?\d+\.\d+/.test(location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(formData);
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.location || !validateLocation(formData.location)) {
      setError(t('create.validationLocation'));
      setLoading(false);
      return;
    }

    try {
      const jobData = {
        title: formData.title || "",
        titleMedia: "",
        jobOwner: formData.jobOwner || "",
        score: formData.score || "",
        salaryStart: formData.salaryStart || "",
        workingHoursPerWeek: formData.workingHoursPerWeek || 0,
        salaryEnd: formData.salaryEnd || "",
        // startDate: formData.startDate || "",
        // endDate: formData.endDate || "",
        // timeStart: formData.timeStart || "",
        // timeEnd: formData.timeEnd || "",
        description: formData.description || "",
        qualifications: formData.qualifications || "",
        address: formData.address || "",
        location: formData.location || "",
        candidateCriteria: formData.candidateCriteria || "",
        companyID: formData.companyID || "",
        jobTypeID: formData.jobTypeID || "",
        jobManpowerID: formData.jobManpowerID || "",
        acceptingPosition: Number(formData.acceptingPosition) || 0,
        createdAt: new Date().toISOString(),
        createdBy: userInfo?.id || "",
        images: [],
        videos: []
      };

      const formDataToSend = new FormData();
      formDataToSend.append("job", JSON.stringify(jobData));

      if (titleMediaPreview?.file) {
        formDataToSend.append("titleMedia", titleMediaPreview.file);
      } else {
        formDataToSend.append("titleMedia", "");
      }

      if (formData.images?.length > 0) {
        formData.images.forEach((image) => {
          if (image instanceof File) {
            formDataToSend.append("images", image);
          }
        });
      }

      if (formData.videos?.length > 0) {
        formData.videos.forEach((video) => {
          if (video instanceof File) {
            formDataToSend.append("videos", video);
          }
        });
      }

      const result = await api.post<{ message?: string }>("jobs", formDataToSend);

      if (result.code !== 201 && result.status !== "Created") {
        throw new Error(
          result.data?.message ||
          result.status ||
          "Failed to create job"
        );
      }

      // const jobsResult = await api.get<ApiResponse<any[]>>("jobs");
      // if (jobsResult.code === 200 && jobsResult.status === "OK" && Array.isArray(jobsResult.data)) {
      //   sessionStorage.setItem("jobs", JSON.stringify(jobsResult.data));
      // } else {
      //   console.error("Failed to fetch updated jobs data");
      // }
      sessionStorage.removeItem('jobs');
      navigate("/jobs");
    } catch (err) {
      console.error("Error creating job:", err);
      setError(t('create.errorDescription'));
    } finally {
      setLoading(false);
    }
  };

  const navigateToCreateManpower = () => {
    navigate("/jobmanpower/create");
  };

  const closeEmptyManpowerModal = () => {
    setShowEmptyManpowerModal(false);
  };

  const navigateToCreateCompany = () => {
    navigate("/company/create");
  };

  const closeEmptyCompanyModal = () => {
    setShowEmptyCompanyModal(false);
  };

  const navigateToCreateJobType = () => {
    navigate("/jobs/types/create");
  };

  const closeEmptyJobTypesModal = () => {
    setShowEmptyJobTypesModal(false);
  };

  return (
    <div className="p-2">
      {/* Empty Manpower Modal */}
      {showEmptyManpowerModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-2">{t('create.emptyManpowerTitle')}</h3>
            <p className="text-gray-600 text-center mb-6">
              {t('create.emptyManpowerDesc')}
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={closeEmptyManpowerModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('create.cancel')}
              </button>
              <button
                onClick={navigateToCreateManpower}
                className="px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-lg hover:bg-blue-700"
              >
                {t('create.createManpower')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Company Modal */}
      {showEmptyCompanyModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-2">{t('create.emptyCompanyTitle')}</h3>
            <p className="text-gray-600 text-center mb-6">
              {t('create.emptyCompanyDesc')}
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={closeEmptyCompanyModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('create.cancel')}
              </button>
              <button
                onClick={navigateToCreateCompany}
                className="px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-lg hover:bg-blue-700"
              >
                {t('create.createCompany')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Job Types Modal */}
      {showEmptyJobTypesModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-2">{t('create.emptyJobTypesTitle')}</h3>
            <p className="text-gray-600 text-center mb-6">
              {t('create.emptyJobTypesDesc')}
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={closeEmptyJobTypesModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('create.cancel')}
              </button>
              <button
                onClick={navigateToCreateJobType}
                className="px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-lg hover:bg-blue-700"
              >
                {t('create.createJobType')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal for file size error */}
      {showFileSizeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="animate-[fadeInScale_0.3s_ease] bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center relative border border-teal-200">
            <div className="flex flex-col items-center">
              <div className="bg-red-100 rounded-full p-4 mb-2 animate-bounce">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-red-700 text-lg font-semibold mb-2 drop-shadow">{t('create.fileSizeError')}</div>
            </div>
            <button
              className="mt-6 cursor-pointer px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-full shadow hover:scale-105 hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-150"
              onClick={() => setShowFileSizeError(false)}
              autoFocus
            >
              {t('create.close')}
            </button>
            <style>{`
      @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0.9); }
        100% { opacity: 1; transform: scale(1); }
      }
    `}</style>
          </div>
        </div>
      )}
      <div className="w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/jobs"
            className="flex items-center text-gray-600 hover:text-gray-900"
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
            {t('create.backToList')}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">{t('create.pageTitle')}</h1>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: ข้อมูลพื้นฐาน */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('create.basicInfo')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.jobTitle')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder={language1 === 'th' ? "เช่น โฟร์แมน" : "e.g. Foreman"}
                    />
                  </div>

                  {/* jobType */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.jobType')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jobTypeID"
                      value={formData.jobTypeID}
                      onChange={handleInputChange}
                      required
                      disabled={loadingJobTypes}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                    >
                      <option value="">{t('create.selectJobType')}</option>
                      {jobTypes.map((jobType) => (
                        <option key={jobType.id} value={jobType.id}>
                          {jobType.name}
                        </option>
                      ))}
                    </select>
                    {loadingJobTypes && (
                      <p className="mt-1 text-sm text-gray-500">
                        {t('create.loading')}
                      </p>
                    )}
                    {jobTypes.length === 0 && !loadingJobTypes && (
                      <p className="mt-1 text-sm text-red-500">
                        {t('create.noJobType')}
                      </p>
                    )}
                  </div>

                  {/* company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.company')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="companyID"
                      value={formData.companyID ?? ""}
                      onChange={handleInputChange}
                      required
                      disabled={loadingCompanies || companyDisabled}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                    >
                      <option value="">{t('create.selectCompany')}</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id} disabled={companyDisabled}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {loadingCompanies && (
                      <p className="mt-1 text-sm text-gray-500">
                        {t('create.loading')}
                      </p>
                    )}
                    {companies.length === 0 && !loadingCompanies && (
                      <p className="mt-1 text-sm text-red-500">
                        {t('create.noCompany')}
                      </p>
                    )}
                  </div>

                  {/* jobManpower */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.jobManpower')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jobManpowerID"
                      value={formData.jobManpowerID ?? ""}
                      onChange={handleInputChange}
                      required
                      disabled={loadingJobManpower || jobManpowerDisabled}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                    >
                      <option value="">{t('create.selectJobManpower')}</option>
                      {jobManpowerList.map((manpower) => (
                        <option key={manpower.id} value={manpower.id} disabled={jobManpowerDisabled}>
                          {manpower.name}
                        </option>
                      ))}
                    </select>
                    {loadingJobManpower && (
                      <p className="mt-1 text-sm text-gray-500">
                        {t('create.loading')}
                      </p>
                    )}
                    {jobManpowerList.length === 0 && !loadingJobManpower && (
                      <p className="mt-1 text-sm text-red-500">
                        {t('create.noManpower')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.titleMedia')} <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 flex flex-row space-x-4 h-64">
                      {/* Upload Area */}
                      <div className="flex-1 relative group overflow-hidden border-2 border-gray-300 border-dashed hover:border-teal-500 transition-colors duration-200 ease-in-out rounded-lg cursor-pointer">
                        {/* Title Media input */}
                        <input
                          id="titleMedia"
                          name="titleMedia"
                          type="file"
                          ref={titleMediaInputRef}
                          accept="image/*,video/*"
                          onChange={handleTitleMediaChange}
                          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-5">
                          <div className="bg-teal-50 rounded-full p-3 mb-3">
                            <svg
                              className="w-10 h-10 text-teal-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-teal-600 mb-1">
                              {t('create.uploadImageOrVideo')}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">{t('create.dragAndDrop')}</p>
                            <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {t('create.acceptFormat')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview Area */}
                      <div className="flex-1 relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white">
                        {titleMediaPreview ? (
                          <div className="relative h-full w-full">
                            <button
                              type="button"
                              onClick={removeTitleMedia}
                              className="absolute top-2 right-2 bg-white bg-opacity-80 text-red-500 rounded-full p-2 shadow-md hover:bg-opacity-100 hover:text-red-600 transition-all duration-200 z-20"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {titleMediaPreview.type === "image" ? (
                                <img
                                  src={titleMediaPreview.url}
                                  alt="Title media preview"
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <video
                                  src={titleMediaPreview.url}
                                  controls
                                  className="max-h-full max-w-full"
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="text-center p-6">
                              <div className="bg-gray-100 rounded-full p-3 mx-auto mb-3">
                                <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-400 mb-1">{t('create.noFileSelected')}</p>
                              <p className="text-xs text-gray-400">{t('create.imageOrVideoWillBeDisplayedHere')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: เงินเดือนและเวลาทำงาน */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('create.salaryAndTime')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.acceptingPositions')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="acceptingPosition"
                      value={formData.acceptingPosition}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น 5"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('create.enterWholeNumberOnly')}</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('create.score')} {userInfo?.role.name.toLowerCase()}
                    </label>
                    <div className="w-full flex items-center justify-between gap-4">
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          disabled={userInfo?.role.name.toLowerCase() !== 'supperadmin' && userInfo?.role.name.toLowerCase() !== 'admin'}
                          onClick={() =>
                            handleScoreTypeChange(
                              selectedScoreType === "slide"
                                ? "notslide"
                                : "slide"
                            )
                          }
                          className={`relative cursor-pointer flex items-center h-8 w-24 rounded-full transition-colors duration-300 ease-in-out focus:outline-none  ${selectedScoreType === "slide"
                            ? "bg-gradient-to-r from-teal-500 to-green-500 shadow-lg shadow-teal-400"
                            : "bg-gray-300"
                            }`}
                        >
                          <span
                            className={`absolute left-4 text-xs font-medium transition-all duration-300 ${selectedScoreType === "slide"
                              ? "text-white opacity-100"
                              : "opacity-0"
                              }`}
                          >
                            Slide
                          </span>

                          <motion.span
                            layout
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20
                            }}
                            className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
                            animate={{
                              left:
                                selectedScoreType === "slide"
                                  ? "calc(100% - 2rem)"
                                  : "4px"
                            }}
                          />
                          <span
                            className={`absolute right-4 text-xs font-medium transition-all duration-300 ${selectedScoreType === "slide"
                              ? "opacity-0"
                              : "text-white opacity-100"
                              }`}
                          >
                            Not Slide
                          </span>
                        </button>
                      </div>

                      <div className="flex-1">
                        <input
                          type="number"
                          name="score"
                          disabled={userInfo?.role.name.toLowerCase() !== 'supperadmin' && userInfo?.role.name.toLowerCase() !== 'admin'}
                          value={formData.score}
                          onChange={(e) =>
                            setFormData(prev => ({
                              ...prev,
                              score: e.target.value
                            }))
                          }
                          step="any"
                          min="0"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="เช่น 10.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ช่องกรอกเงินเดือนเริ่มต้น */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.salaryStart')}{" "}
                    </label>
                    <input
                      type="text"
                      name="salaryStart"
                      value={formData.salaryStart}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น 15,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.salaryEnd')}
                    </label>
                    <input
                      type="text"
                      name="salaryEnd"
                      value={formData.salaryEnd}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น 25,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.workingHoursPerWeek')}
                    </label>
                    <input
                      type="number"
                      name="workingHoursPerWeek"
                      value={formData.workingHoursPerWeek}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น 40.50"
                    />
                  </div>



                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.startDate')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="จันทร์">จันทร์</option>
                      <option value="อังคาร">อังคาร</option>
                      <option value="พุธ">พุธ</option>
                      <option value="พฤหัสบดี">พฤหัสบดี</option>
                      <option value="ศุกร์">ศุกร์</option>
                      <option value="เสาร์">เสาร์</option>
                      <option value="อาทิตย์">อาทิตย์</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.endDate')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="จันทร์">จันทร์</option>
                      <option value="อังคาร">อังคาร</option>
                      <option value="พุธ">พุธ</option>
                      <option value="พฤหัสบดี">พฤหัสบดี</option>
                      <option value="ศุกร์">ศุกร์</option>
                      <option value="เสาร์">เสาร์</option>
                      <option value="อาทิตย์">อาทิตย์</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.timeStart')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="timeStart"
                      value={formData.timeStart}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.timeEnd')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="timeEnd"
                      value={formData.timeEnd}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div> */}
                </div>
              </div>

              {/* Section 3: รายละเอียดงาน */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('create.jobDetails')}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.jobDescription')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="อธิบายรายละเอียดของงาน หน้าที่ความรับผิดชอบ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.qualifications')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="ระบุคุณสมบัติที่ต้องการ เช่น อายุ เพศ การศึกษา"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.candidateCriteria')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="candidateCriteria"
                      value={formData.candidateCriteria}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="ระบุเกณฑ์การคัดเลือกผู้สมัคร"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: สถานที่ทำงาน */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('create.workLocation')}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('create.address')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="ระบุที่อยู่สถานที่ทำงาน"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t('create.location')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="13.7563,100.5018"
                      required
                      pattern="-?\d+\.\d+,\s*-?\d+\.\d+"
                      title="กรุณาระบุพิกัดในรูปแบบ Latitude,Longitude เช่น 13.7563,100.5018"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      กรุณาระบุพิกัดในรูปแบบ Latitude,Longitude เช่น 13.7563,100.5018
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: รูปภาพและวิดีโอ */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('create.imagesAndVideos')}
                </h2>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('create.images')}
                  </label>
                  <div className="mt-1 flex flex-col gap-4">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 015.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="images"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                          >
                            <span>{t('create.uploadImages')}</span>
                            {/* Image upload input */}
                            <input
                              id="images"
                              name="images"
                              type="file"
                              ref={imagesInputRef}
                              multiple
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF สูงสุด 500KB ต่อไฟล์
                        </p>
                      </div>
                    </div>

                    {/* Image Previews */}
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('create.videos')}
                  </label>
                  <div className="mt-1 flex flex-col gap-4">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2m0 0l4-4m4-4l4 4m-4-4v8m-12 4h.02"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="videos"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                          >
                            <span>{t('create.uploadVideos')}</span>
                            {/* Video upload input */}
                            <input
                              id="videos"
                              name="videos"
                              type="file"
                              ref={videosInputRef}
                              multiple
                              accept="video/*"
                              className="sr-only"
                              onChange={handleVideoUpload}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          MP4, WebM สูงสุด 100MB ต่อไฟล์
                        </p>
                      </div>
                    </div>

                    {/* Video Previews */}
                    {videoPreview.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {videoPreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <video
                              src={preview.url}
                              className="h-24 w-full object-cover rounded-lg"
                              controls
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <Link
                  to="/jobs"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('create.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading ? t('create.saving') : t('create.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
