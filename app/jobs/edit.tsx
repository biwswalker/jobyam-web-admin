import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { type ApiResponse } from '../services/api';
import { motion } from 'framer-motion';
import { useLanguage1 } from "../context/LanguageContext"; // Import your existing language hook
import { type Job, type JobManpower, type JobType, type Company, type ScoreData, type ImageWithId, type VideoWithId, type TitleMediaResponse, type MediaPreview } from "../model/jobs";
import { id } from 'date-fns/locale';

const JobEdit: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL_MEDIA;
  // Add these refs to track file inputs
  const titleMediaInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const videosInputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);
  const [uploadingTitleMedia, setUploadingTitleMedia] = useState(false);

  const [titleMediaPreview, setTitleMediaPreview] = useState<MediaPreview | null>(null);
  const [imagePreview, setImagePreview] = useState<MediaPreview[]>([]);
  const [videoPreview, setVideoPreview] = useState<MediaPreview[]>([]);
  const [jobManpowerList, setJobManpowerList] = useState<JobManpower[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [selectedScoreType, setSelectedScoreType] = useState<string>('slide');
  const [userInfo, setUserInfo] = useState<any>(null);
  const { t, language1 } = useLanguage1(); // Use your existing language hook

  // Add a new state for controlling confirmation dialogs
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<{ type: 'image' | 'video', index: number } | null>(null);

  // Add a new state for controlling title media deletion confirmation
  const [showTitleMediaDeleteConfirmation, setShowTitleMediaDeleteConfirmation] = useState(false);

  // Add these state variables at the top with your other state declarations
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Add these state variables at the top with your other state declarations
  const [titleMediaError, setTitleMediaError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [showFileSizeError, setShowFileSizeError] = useState(false);

  // Add these functions to handle media viewing
  const handleViewImage = (url: string) => {
    setSelectedMediaUrl(url);
    setShowImageViewer(true);
  };

  const handleViewVideo = (url: string) => {
    setSelectedMediaUrl(url);
    setShowVideoPlayer(true);
  };

  const closeMediaViewer = () => {
    setShowImageViewer(false);
    setShowVideoPlayer(false);
    setSelectedMediaUrl(null);
  };

  const formatNumberWithCommas = (value: string): string => {
    if (!value) return '';

    if (!/^\d+$/.test(value)) {
      return value;
    }

    const num = parseInt(value, 10);

    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseJobDateToStartEndDates = (jobDate: string | undefined) => {
    if (!jobDate) return { startDate: '', endDate: '' };

    // Split by the "-" character and trim whitespace
    const parts = jobDate.split('-').map(part => part.trim());

    if (parts.length >= 2) {
      return {
        startDate: parts[0],
        endDate: parts[1]
      };
    } else {
      // If the format is unexpected, return empty values
      return { startDate: '', endDate: '' };
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Helper function to map job data with full URLs
        const mapJobData = (job: any): Job => {
          if (!job) return job;

          // Extract salary data
          let salaryStart = '';
          let salaryEnd = '';

          // if (job.jobSalary) {
          //   const salaryParts = job.jobSalary.split('-').map((s: string) => s.trim());
          //   salaryStart = job.salaryStart;
          //   salaryEnd = job.salaryEnd;
          // } else {
            salaryStart = job.salaryStart || '';
            salaryEnd = job.salaryEnd || '';
          // }

          // Extract time data
          let timeStart = '';
          let timeEnd = '';

          if (job.jobTime) {
            const timeParts = job.jobTime.split('-').map((t: string) => t.trim());
            timeStart = timeParts[0] || '';
            timeEnd = timeParts[1] || '';
          } else {
            timeStart = job.timeStart || '';
            timeEnd = job.timeEnd || '';
          }

          // Create jobDate from startDate and endDate
          let jobDate = '';
          if (job.startDate && job.endDate) {
            jobDate = `${job.startDate} - ${job.endDate}`;
          } else if (job.jobDate) {
            // If jobDate already exists, use it
            jobDate = job.jobDate;
          }

          return {
            ...job,
            jobSalary: job.jobSalary || '',
            salaryStart: salaryStart,
            salaryEnd: salaryEnd,
            jobTime: job.jobTime || '',
            timeStart: timeStart,
            timeEnd: timeEnd,
            startDate: job.startDate || '',
            endDate: job.endDate || '',
            jobDate: jobDate,
            // Add full URL path to media assets
            titleMedia: job.titleMedia?.startsWith("http")
              ? job.titleMedia
              : API_URL + job.titleMedia,
            // Process images array
            images: (job.images || []).map((img: string) =>
              img.startsWith("http") ? img : API_URL + img
            ),
            // Process videos array
            videos: (job.videos || []).map((video: string) =>
              video.startsWith("http") ? video : API_URL + video
            ),
            // Process the certificate URL in jobManpowerDetail
            jobManpowerDetail: job.jobManpowerDetail ? {
              ...job.jobManpowerDetail,
              certificate: job.jobManpowerDetail.certificate?.startsWith("http")
                ? job.jobManpowerDetail.certificate
                : API_URL + job.jobManpowerDetail.certificate
            } : undefined
          };
        };

        // Fetch job data directly from API
        const response = await api.get<Job>(`jobs/${id}`);

        if (!response || !response.data) {
          throw new Error("Invalid API response structure");
        }

        // Check the correct API structure
        if (response.code === 200 && response.status === 'OK') {
          if (response.data) {
            // Transform the data using mapJobData
            const mappedJobData = mapJobData(response.data);

            mappedJobData.score = mappedJobData.score || '0';

            // Check the score value to determine if it's a "slide" type (score around 10)
            // or "notslide" type (score around 20)
            if (parseFloat(mappedJobData.score) <= 12) {
              setSelectedScoreType("slide");
            } else {
              setSelectedScoreType("notslide");
            }

            // Parse jobDate field if it exists
            if (mappedJobData.jobDate && (!mappedJobData.startDate || !mappedJobData.endDate)) {
              const { startDate, endDate } = parseJobDateToStartEndDates(mappedJobData.jobDate);

              // Update the job data with parsed dates
              mappedJobData.startDate = startDate || mappedJobData.startDate;
              mappedJobData.endDate = endDate || mappedJobData.endDate;
            }

            setJob(mappedJobData);

            // Set preview for title media
            if (mappedJobData.titleMedia) {
              const type = mappedJobData.titleMedia.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/)
                ? 'video'
                : 'image';
              setTitleMediaPreview({
                url: mappedJobData.titleMedia,
                type: type
              });
            }

            // Set image previews using imagesWithId if available
            if (mappedJobData.imagesWithId && Array.isArray(mappedJobData.imagesWithId)) {
              setImagePreview(mappedJobData.imagesWithId.map((img: ImageWithId) => {
                // Handle both imageUrl and imageURL formats
                const imageUrl = img.imageUrl || img.imageURL;

                return {
                  url: imageUrl?.startsWith("http")
                    ? imageUrl
                    : API_URL + imageUrl,
                  type: 'image',
                  id: img.id
                };
              }));
            } else if (mappedJobData.images && Array.isArray(mappedJobData.images)) {
              setImagePreview(mappedJobData.images.map((img: string) => ({
                url: img.startsWith("http") ? img : API_URL + img,
                type: 'image'
              })));
            }

            // Set video previews using videosWithId if available
            if (mappedJobData.videosWithId && Array.isArray(mappedJobData.videosWithId)) {
              setVideoPreview(mappedJobData.videosWithId.map((vid: VideoWithId) => {
                // Handle both videoUrl and videoURL formats
                const videoUrl = vid.videoUrl || vid.videoURL;

                return {
                  url: videoUrl?.startsWith("http")
                    ? videoUrl
                    : API_URL + videoUrl,
                  type: 'video',
                  id: vid.id
                };
              }));
            } else if (mappedJobData.videos && Array.isArray(mappedJobData.videos)) {
              setVideoPreview(mappedJobData.videos.map((vid: string) => ({
                url: vid.startsWith("http") ? vid : API_URL + vid,
                type: 'video'
              })));
            }
          }
        } else {
          throw new Error('Failed to fetch job details');
        }

        // Fetch auxiliary data (companies, job types, etc.)

        // Fetch companies
        const companiesResult = await api.get<ApiResponse<Company[]>>('jobs/company/select');
        if (companiesResult.code === 200 && companiesResult.status === 'OK' && Array.isArray(companiesResult.data)) {
          setCompanies(companiesResult.data);
        }

        // Fetch job types
        const jobTypesResult = await api.get<ApiResponse<JobType[]>>('jobs/types/select');
        if (jobTypesResult.code === 200 && jobTypesResult.status === 'OK' && Array.isArray(jobTypesResult.data)) {
          setJobTypes(jobTypesResult.data);
          sessionStorage.setItem('jobtypes', JSON.stringify(jobTypesResult.data));
        }

        // Fetch job manpower
        const manpowerResult = await api.get<ApiResponse<JobManpower[]>>('jobmanpower/select');
        if (manpowerResult.code === 200 && manpowerResult.status === 'OK' && Array.isArray(manpowerResult.data)) {
          setJobManpowerList(manpowerResult.data);
        }

        // Fetch scores
        const scoresResult = await api.get<ApiResponse<ScoreData[]>>('jobs/score');
        if (scoresResult.code === 200 && scoresResult.status === 'OK' && Array.isArray(scoresResult.data)) {
          setScores(scoresResult.data);
        }
      } catch (err) {
        console.error("Error fetching job data:", err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleScoreTypeChange = (type: string) => {
    setSelectedScoreType(type);

    const selectedScore = scores.find((s) => s.RangeLabel === type)?.MaxScore || (type === "slide" ? 10 : 20);
    const newScore = Number((selectedScore + 0.01).toFixed(2));

    setJob(prev => prev ? {
      ...prev,
      score: newScore.toString()
    } : null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('jobyamUserAdmin');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserInfo(user);
        } catch { }
      }
    }
  }, []);

  const addTitleMedia = async (file: File) => {
    try {
      setTitleMediaError(null);
      const formData = new FormData();
      formData.append("titleMedia", file);
      const response = await api.post<TitleMediaResponse>(`jobs/create/title/${id}`, formData);

      if ((response.code === 201 || response.code === 200) &&
        (response.status === 'Created' || response.status === 'OK') &&
        response.data) {
        const titleMediaPath = response.data.data?.titleMedia;

        if (!titleMediaPath) {
          setTitleMediaError("เกิดข้อผิดพลาด: ไม่พบ URL ของไฟล์ในการตอบกลับ");
          return null;
        }

        setJob(prev => prev ? {
          ...prev,
          titleMedia: titleMediaPath
        } : null);

        return {
          url: titleMediaPath.startsWith("http")
            ? titleMediaPath
            : API_URL + titleMediaPath,
          type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
          id: response.data.data?.id
        };
      } else {
        console.error('Failed to upload title media:', response);
        setTitleMediaError("เกิดข้อผิดพลาด: ไฟล์มีขนาดใหญ่เกินไปหรือรูปแบบไม่ถูกต้อง กรุณาลองใช้ไฟล์อื่น");
        return null;
      }
    } catch (error) {
      console.error('Error uploading title media:', error);
      setTitleMediaError("เกิดข้อผิดพลาด: ไฟล์มีขนาดใหญ่เกินไปหรือรูปแบบไม่ถูกต้อง กรุณาลองใช้ไฟล์อื่น");
      return null;
    }
  };

  const deleteTitleMedia = async () => {
    try {
      if (!id) return;

      setDeletingMedia(true);
      const response = await api.delete(`jobs/delete/title/${id}`);

      if (response.code === 200 && response.status === 'OK') {
        setJob(prev => prev ? {
          ...prev,
          titleMedia: undefined
        } : null);
        if (titleMediaPreview?.url.startsWith('blob:')) {
          URL.revokeObjectURL(titleMediaPreview.url);
        }
        setTitleMediaPreview(null);

        return true;
      } else {
        console.error('Failed to delete title media:', response);
        return false;
      }
    } catch (error) {
      console.error('Error deleting title media:', error);
      return false;
    } finally {
      setDeletingMedia(false);
    }
  };

  const handleTitleMediaDeleteClick = () => {
    setShowTitleMediaDeleteConfirmation(true);
  };

  const confirmTitleMediaDelete = async () => {
    try {
      setDeletingMedia(true);
      const success = await deleteTitleMedia();
      if (success) {
      }
    } catch (error) {
    } finally {
      setDeletingMedia(false);
      setShowTitleMediaDeleteConfirmation(false);
    }
  };

  const cancelTitleMediaDelete = () => {
    setShowTitleMediaDeleteConfirmation(false);
  };

  const handleTitleMediaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      setTitleMediaError(null);

      if (!isImage && !isVideo) {
        setTitleMediaError(t("create.errorInvalidFile"));
        return;
      }

      // Check max size for images: 500KB
      if (isImage && file.size > 500 * 1024) {
        setShowFileSizeError(true);
        setUploadingTitleMedia(false);
        return;
      }
      if (titleMediaInputRef.current) {
        titleMediaInputRef.current.value = '';
      }

      const tempPreviewUrl = URL.createObjectURL(file);
      const tempPreview = {
        url: tempPreviewUrl,
        type: isImage ? 'image' as const : 'video' as const,
        file
      };

      setUploadingTitleMedia(true);
      setTitleMediaPreview(tempPreview);

      addTitleMedia(file).then(result => {
        if (result) {
          setTitleMediaPreview(result);
          URL.revokeObjectURL(tempPreviewUrl);
        } else {
          URL.revokeObjectURL(tempPreviewUrl);
        }
        setUploadingTitleMedia(false);
      });
    }
  }, [job, id]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageUploadError(null);

    const validImages = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 500 * 1024
    );

    if (validImages.length > 0) {
      const newPreviews = validImages.map((file) => ({
        url: URL.createObjectURL(file),
        type: "image" as const,
        file
      }));
      setImagePreview((prev) => [...prev, ...newPreviews]);
    }

    if (validImages.length === 0) {
      setShowFileSizeError(true);
      setImageUploadError(
        `ไฟล์ต่อไปนี้มีขนาดใหญ่เกิน 500KB: ${files.map(f => f.name).join(", ")}`
      );
      if (imagesInputRef.current) {
        imagesInputRef.current.value = '';
      }
    }

    if (validImages.length === 0) {
      setUploadingImage(false);
      return;
    }

    setUploadingImage(true);

    Promise.all(validImages.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append("images", file);
        console.log(formData.get("images"));
        const response = await api.post<ApiResponse<ImageWithId[]>>(`jobs/create/image/${id}`, formData);

        if (response.code === 201 && response.status === 'Created' && Array.isArray(response.data) && response.data.length > 0) {
          const uploadedImage = response.data[0];
          const imageUrl = uploadedImage.imageUrl || uploadedImage.imageURL;

          if (!imageUrl) {
            console.error('Image URL not found in response:', uploadedImage);
            return null;
          }

          return {
            url: imageUrl.startsWith("http")
              ? imageUrl
              : API_URL + imageUrl,
            type: 'image' as const,
            id: uploadedImage.id
          };
        } else {
          console.error('Failed to upload image or invalid response format:', response);
          return { error: true, fileName: file.name };
        }
      } catch (error) {
        console.error('Error uploading image:', error, file.name);
        return { error: true, fileName: file.name };
      }
    })).then(results => {
      const failedUploads = results.filter(result => result && 'error' in result) as { error: boolean, fileName: string }[];
      if (failedUploads.length > 0) {
        const fileNames = failedUploads.map(item => item.fileName).join(", ");
        setImageUploadError(`การอัพโหลดล้มเหลว: ${fileNames} (ไฟล์อาจมีขนาดใหญ่เกินไปหรือรูปแบบไม่ถูกต้อง)`);
      }

      setUploadingImage(false);
      if (imagesInputRef.current) {
        imagesInputRef.current.value = '';
      }
    });
  }, [id]);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newVideos = files.filter((file) => file.type.startsWith("video/"));

    // Clear previous error
    setVideoUploadError(null);

    if (newVideos.length === 0) {
      return;
    }

    // Check file sizes before upload
    let oversizedFiles = newVideos.filter(file => file.size > 100 * 1024 * 1024); // > 100MB
    if (oversizedFiles.length > 0) {
      setVideoUploadError(`${oversizedFiles.length} ไฟล์มีขนาดใหญ่เกิน 100MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า`);
      return;
    }

    // Show loading indicator
    setUploadingVideo(true);

    // Process and upload each new video
    Promise.all(newVideos.map(async (file) => {
      try {
        // Create form data for this specific video
        const formData = new FormData();
        formData.append("videos", file);

        // Upload video to the backend immediately
        const response = await api.post<ApiResponse<VideoWithId[]>>(`jobs/create/video/${id}`, formData);

        if (response.code === 201 && response.status === 'Created' && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first uploaded video from the array
          const uploadedVideo = response.data[0];

          // Get the video URL from the response (handle both property names)
          const videoUrl = uploadedVideo.videoUrl || uploadedVideo.videoURL;

          if (!videoUrl) {
            console.error('Video URL not found in response:', uploadedVideo);
            return null;
          }

          // Create a preview with the returned data
          return {
            url: videoUrl.startsWith("http")
              ? videoUrl
              : API_URL + videoUrl,
            type: 'video' as const,
            id: uploadedVideo.id
          };
        } else {
          console.error('Failed to upload video or invalid response format:', response);
          return { error: true, fileName: file.name };
        }
      } catch (error) {
        console.error('Error uploading video:', error, file.name);
        return { error: true, fileName: file.name };
      }
    })).then(results => {
      // Check for errors
      const failedUploads = results.filter(result => result && 'error' in result) as { error: boolean, fileName: string }[];
      if (failedUploads.length > 0) {
        const fileNames = failedUploads.map(item => item.fileName).join(", ");
        setVideoUploadError(`การอัพโหลดล้มเหลว: ${fileNames} (ไฟล์อาจมีขนาดใหญ่เกินไปหรือรูปแบบไม่ถูกต้อง)`);
      }

      // Filter out any failed uploads
      const successfulUploads = results.filter(result => result && !('error' in result)) as MediaPreview[];

      // Add new videos to existing previews
      if (successfulUploads.length > 0) {
        setVideoPreview(prev => [...prev, ...successfulUploads]);
      }
      setUploadingVideo(false);
    });
  }, [id]);

  const handleDeleteButtonClick = (type: 'image' | 'video', index: number) => {
    setMediaToDelete({ type, index });
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;

    const { type, index } = mediaToDelete;
    setDeletingMedia(true);

    try {
      if (type === 'image') {
        const imageToRemove = imagePreview[index];

        if (imageToRemove.id) {
          // Delete the image by ID
          const response = await api.delete(`jobs/delete/image/${imageToRemove.id}`);
          if (response.code === 200) {
            console.log('Image deleted successfully:', imageToRemove.id);
          } else {
            console.error('Failed to delete image:', response);
          }
        }

        // Clean up blob URL
        if (imageToRemove.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageToRemove.url);
        }

        // Remove from preview state
        setImagePreview(prev => prev.filter((_, i) => i !== index));

        // Reset the file input value so the same file can be selected again
        if (imagesInputRef.current) {
          imagesInputRef.current.value = '';
        }
      } else {
        const videoToRemove = videoPreview[index];

        if (videoToRemove.id) {
          // Delete the video by ID
          const response = await api.delete(`jobs/delete/video/${videoToRemove.id}`);
          if (response.code === 200) {
            console.log('Video deleted successfully:', videoToRemove.id);
          } else {
            console.error('Failed to delete video:', response);
          }
        }

        // Clean up blob URL
        if (videoToRemove.url.startsWith('blob:')) {
          URL.revokeObjectURL(videoToRemove.url);
        }

        // Remove from preview state
        setVideoPreview(prev => prev.filter((_, i) => i !== index));
        if (videosInputRef.current) {
          videosInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    } finally {
      setDeletingMedia(false);
      setShowDeleteConfirmation(false);
      setMediaToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setMediaToDelete(null);
  };

  const validateLocation = (location: string): boolean => {
    return /-?\d+\.\d+,\s*-?\d+\.\d+/.test(location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!job) {
        throw new Error('No job data available');
      }

      if (!job.location || !validateLocation(job.location)) {
        setError("กรุณาระบุพิกัดในรูปแบบ Latitude,Longitude เช่น 13.7563,100.5018");
        setSaving(false);
        return;
      }

      const updatedJob = {
        ...job,
        jobDate: `${job.startDate} - ${job.endDate}`
      };

      const normalizedJob = {
        ...updatedJob,
        companyId: updatedJob.companyId || updatedJob.companyID,
        jobTypeId: updatedJob.jobTypeId || updatedJob.jobTypeID,
        jobManpowerId: updatedJob.jobManpowerId || updatedJob.jobManpowerID,
        createdBy: userInfo?.id || "",
      };

      const { images, videos, imagesWithId, videosWithId, ...jobData } = normalizedJob;

      const formDataToSend = new FormData();
      formDataToSend.append("job", JSON.stringify(jobData));
      if (titleMediaPreview?.file) {
        formDataToSend.append("titleMedia", titleMediaPreview.file);
      } else {
        formDataToSend.append("titleMedia", "");
      }

      const result = await api.put<ApiResponse<Job>>(`jobs/${id}`, formDataToSend);

      if (result.code === 200 && result.status === 'OK') {
        // const jobsResult = await api.get<ApiResponse<any[]>>("jobs");
        // if (jobsResult.code === 200 && jobsResult.status === "OK" && Array.isArray(jobsResult.data)) {
        //   sessionStorage.setItem("jobs", JSON.stringify(jobsResult.data));
        // } else {
        //   console.error("Failed to fetch updated jobs data");
        // }
        sessionStorage.removeItem('jobs');
        navigate('/jobs');
      } else {
        throw new Error('Failed to update job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">{t('edit.loading')}</div>;
  }

  if (error || !job) {
    return <div className="text-red-500 text-center p-4">{error || 'ไม่พบข้อมูลงาน'}</div>;
  }

  return (
    <div className="p-2">
      <div className="w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/jobs"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('edit.backToJobs')}
          </Link>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">{t('edit.editJob')}</h1>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {/* Section 1: ข้อมูลพื้นฐาน */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('edit.jobDetails')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.jobTitle')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={job.title || ''}
                      onChange={(e) => setJob({ ...job, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      placeholder="เช่น โฟร์แมน"
                    />
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.jobType')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="jobTypeID"
                      value={job.jobTypeId || job.jobTypeID || ''}
                      onChange={(e) => setJob({ ...job, jobTypeId: e.target.value, jobTypeID: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    >
                      <option value="">{t('edit.selectJobType')}</option>
                      {jobTypes.map((jobType) => (
                        <option key={jobType.id} value={jobType.id}>
                          {jobType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.company')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="companyID"
                      value={job.companyId || job.companyID || ''}
                      onChange={(e) => setJob({ ...job, companyId: e.target.value, companyID: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    >
                      <option value="">{t('edit.selectCompany')}</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Job Manpower */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.jobManpower')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="jobManpowerID"
                      value={job.jobManpowerId || job.jobManpowerID || ''}
                      onChange={(e) => setJob({ ...job, jobManpowerId: e.target.value, jobManpowerID: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    >
                      <option value="">{t('edit.selectJobManpower')}</option>
                      {jobManpowerList.map((manpower) => (
                        <option key={manpower.id} value={manpower.id}>
                          {manpower.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title Media - Full width on mobile, 2 columns on larger screens */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.titleMedia')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 h-auto sm:h-64">
                      {/* Upload Area */}
                      <div className="flex-1 relative group overflow-hidden border-2 border-gray-300 border-dashed hover:border-teal-500 transition-colors duration-200 ease-in-out rounded-lg cursor-pointer min-h-[200px] sm:min-h-0">
                        <input
                          id="titleMedia"
                          name="titleMedia"
                          type="file"
                          ref={titleMediaInputRef}
                          accept="image/*,video/*"
                          onChange={handleTitleMediaChange}
                          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-5">
                          <div className="bg-teal-50 rounded-full p-2 sm:p-3 mb-2 sm:mb-3">
                            <svg
                              className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500"
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
                              {t('edit.uploadImageOrVideo')}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">{t('edit.orDragAndDropHere')}</p>
                            <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {t('edit.pngJpgMax5MBGifMp4Max20MB')}
                            </div>
                            {titleMediaError && (
                              <p className="text-xs text-red-500 mt-2 bg-red-50 p-1 rounded">
                                {titleMediaError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preview Area */}
                      <div className="flex-1 relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white min-h-[200px] sm:min-h-0">
                        {uploadingTitleMedia ? (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="text-center p-4 sm:p-6">
                              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-500 mx-auto mb-3"></div>
                              <p className="text-sm font-medium text-gray-700">{t('edit.uploading')}...</p>
                            </div>
                          </div>
                        ) : titleMediaPreview ? (
                          <div className="relative h-full w-full">
                            <button
                              type="button"
                              onClick={handleTitleMediaDeleteClick}
                              disabled={deletingMedia}
                              className="absolute top-2 right-2 bg-white bg-opacity-80 text-red-500 rounded-full p-1.5 sm:p-2 shadow-md hover:bg-opacity-100 hover:text-red-600 transition-all duration-200 z-20 disabled:opacity-50"
                            >
                              {deletingMedia ? (
                                <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                              ) : (
                                <svg
                                  className="w-4 h-4 sm:w-5 sm:h-5"
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
                              )}
                            </button>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {titleMediaPreview?.type === "image" ? (
                                <img
                                  src={titleMediaPreview.url}
                                  alt="Title media preview"
                                  className="max-h-full max-w-full object-contain cursor-pointer"
                                  onClick={() => handleViewImage(titleMediaPreview.url)}
                                />
                              ) : (
                                <video
                                  src={titleMediaPreview.url}
                                  controls
                                  className="max-h-full max-w-full cursor-pointer"
                                  onClick={() => handleViewVideo(titleMediaPreview.url)}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="text-center p-4 sm:p-6">
                              <div className="bg-gray-100 rounded-full p-2 sm:p-3 mx-auto mb-2 sm:mb-3">
                                <svg
                                  className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M9 13h6m-3-3v6m-9-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-400 mb-1">{t('edit.noFileSelected')}</p>
                              <p className="text-xs text-gray-400">{t('edit.previewHere')}</p>
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
                  {t('edit.salaryAndWorkingTime')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accepting Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.acceptingPosition')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="acceptingPosition"
                      value={job.acceptingPosition || ''}
                      onChange={(e) => {
                        const { value } = e.target;
                        let numValue = parseInt(value);
                        if (value.startsWith('0') && value.length > 1) {
                          const trimmedValue = value.replace(/^0+/, '');
                          e.target.value = trimmedValue;
                          numValue = parseInt(trimmedValue);
                        }
                        if (!isNaN(numValue) && numValue > 0) {
                          setJob({ ...job, acceptingPosition: numValue });
                        } else if (value === "") {
                          setJob({ ...job, acceptingPosition: 0 });
                        } else if (value === "0") {
                          setJob({ ...job, acceptingPosition: 0 });
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      min="1"
                      placeholder="เช่น 5"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('edit.onlyInteger')}</p>
                  </div>

                  {/* Score */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('edit.score')}
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
                            {t('edit.slide')}
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
                            {t('edit.notSlide')}
                          </span>
                        </button>
                      </div>

                      <div className="flex-1">
                        <input
                          type="number"
                          name="score"
                          disabled={userInfo?.role.name.toLowerCase() !== 'supperadmin' && userInfo?.role.name.toLowerCase() !== 'admin'}
                          value={job.score || ''}
                          onChange={(e) =>
                            setJob(prev => prev ? {
                              ...prev,
                              score: e.target.value
                            } : null)
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="เช่น 10.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Start */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.salaryStart')}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="salaryStart"
                      value={job.salaryStart || ''}
                      onChange={(e) => {
                        const { value } = e.target;
                        let numericValue = value.replace(/,/g, '');
                        if (numericValue.startsWith('0') && numericValue.length > 1) {
                          numericValue = numericValue.replace(/^0+/, '');
                        }
                        if (numericValue === '' || /^\d+$/.test(numericValue)) {
                          const formattedValue = formatNumberWithCommas(numericValue);
                          setJob({ ...job, salaryStart: formattedValue });
                          e.target.value = formattedValue;
                        } else {
                          setJob({ ...job, salaryStart: value });
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      placeholder="เช่น 15,000"
                    />
                  </div>

                  {/* Salary End */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.salaryEnd')}
                    </label>
                    <input
                      type="text"
                      id="salaryEnd"
                      value={job.salaryEnd || ''}
                      onChange={(e) => {
                        const { value } = e.target;
                        let numericValue = value.replace(/,/g, '');
                        if (numericValue.startsWith('0') && numericValue.length > 1) {
                          numericValue = numericValue.replace(/^0+/, '');
                        }
                        if (numericValue === '' || /^\d+$/.test(numericValue)) {
                          const formattedValue = formatNumberWithCommas(numericValue);
                          setJob({ ...job, salaryEnd: formattedValue });
                          e.target.value = formattedValue;
                        } else {
                          setJob({ ...job, salaryEnd: value });
                        }
                      }}
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
                      value={job.workingHoursPerWeek}
                      onChange={(e) => setJob({ ...job, workingHoursPerWeek: Number(e.target.value) })}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น 40.50"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: รายละเอียดงาน */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('edit.jobDetails')}
                </h2>
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.description')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      value={job.description || ''}
                      onChange={(e) => setJob({ ...job, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      placeholder="อธิบายรายละเอียดของงาน หน้าที่ความรับผิดชอบ"
                    />
                  </div>

                  {/* Qualifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.qualifications')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="qualifications"
                      value={job.qualifications || ''}
                      onChange={(e) => setJob({ ...job, qualifications: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      placeholder="ระบุคุณสมบัติที่ต้องการ เช่น อายุ เพศ การศึกษา"
                    />
                  </div>

                  {/* Candidate Criteria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.candidateCriteria')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="candidateCriteria"
                      value={job.candidateCriteria || ''}
                      onChange={(e) => setJob({ ...job, candidateCriteria: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      placeholder={t('edit.candidateCriteria')}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: สถานที่ทำงาน */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('edit.jobLocation')}
                </h2>
                <div className="space-y-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.address')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      value={job.address || ''}
                      onChange={(e) => setJob({ ...job, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      placeholder={t('edit.address')}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('edit.location')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={job.location || ''}
                      onChange={(e) => setJob({ ...job, location: e.target.value })}
                      placeholder="13.7563,100.5018"
                      required
                      pattern="-?\d+\.\d+,\s*-?\d+\.\d+"
                      title={t('edit.location')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    {/* <p className="mt-1 text-xs text-gray-500">
                      {t('edit.location')}
                    </p> */}
                  </div>
                </div>
              </div>

              {/* Section 5: รูปภาพและวิดีโอ */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  {t('edit.media')}
                </h2>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('edit.media')}
                  </label>
                  <div className="mt-1 flex flex-col gap-4">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-teal-500 transition-colors">
                      <div className="space-y-3 text-center">
                        <div className="flex justify-center">
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
                        <div className="flex justify-center text-sm text-gray-600">
                          <label
                            htmlFor="images"
                            className="relative cursor-pointer bg-teal-50 rounded-md font-medium text-teal-600 hover:text-teal-500 py-2 px-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                          >
                            <span>{t('edit.media')}</span>
                            <input
                              id="images"
                              name="images"
                              type="file"
                              multiple
                              ref={imagesInputRef}
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('edit.mediaSize')}
                        </p>
                        {imageUploadError && (
                          <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded-lg">
                            <span className="font-medium">{t('edit.error')}:</span> {imageUploadError}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {t('edit.mediaDragDrop')}
                        </p>
                      </div>
                    </div>

                    {/* Loading indicator for images */}
                    {uploadingImage && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                        <span className="ml-2 text-sm text-gray-600">{t('edit.uploadingImage')}...</span>
                      </div>
                    )}

                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-full object-cover rounded-lg cursor-pointer"
                              onClick={() => handleViewImage(preview.url)}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteButtonClick('image', index)}
                              disabled={deletingMedia}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
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
                    {t('edit.video')}
                  </label>
                  <div className="mt-1 flex flex-col gap-4">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg
                          className="w-10 h-10 text-teal-500 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="1.5" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M10 8v8l6-4-6-4z"
                          />
                          <line x1="2" y1="10" x2="22" y2="10" strokeWidth="1.5" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="videos"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                          >
                            <span>{t('edit.uploadVideo')}</span>
                            <input
                              id="videos"
                              name="videos"
                              type="file"
                              multiple
                              ref={videosInputRef}
                              accept="video/*"
                              className="sr-only"
                              onChange={handleVideoUpload}
                            />
                          </label>
                          <p className="pl-1">{t('edit.orDragAndDrop')}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('edit.videoSize')}
                        </p>
                        {videoUploadError && (
                          <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded-lg">
                            <span className="font-medium">{t('edit.error')}:</span> {videoUploadError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Loading indicator for videos */}
                    {uploadingVideo && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                        <span className="ml-2 text-sm text-gray-600">{t('edit.uploadingVideo')}...</span>
                      </div>
                    )}

                    {/* Video previews */}
                    {videoPreview.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {videoPreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <video
                              src={preview.url}
                              className="h-24 w-full object-cover rounded-lg cursor-pointer"
                              onClick={() => handleViewVideo(preview.url)}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteButtonClick('video', index)}
                              disabled={deletingMedia}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
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

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 mt-6">
                <Link
                  to="/jobs"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('edit.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? t('edit.saving') : t('edit.save')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in-down">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">{t('edit.confirmDelete')}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {t('edit.confirmDeleteDesc')}
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('edit.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingMedia}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {deletingMedia ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t('edit.deleting')}...
                  </>
                ) : t('edit.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Media Delete Confirmation Dialog */}
      {showTitleMediaDeleteConfirmation && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in-down">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">{t('edit.confirmDeleteTitleMedia')}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {t('edit.confirmDeleteTitleMediaDesc')}
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelTitleMediaDelete}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('edit.cancel')}
              </button>
              <button
                onClick={confirmTitleMediaDelete}
                disabled={deletingMedia}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {deletingMedia ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t('edit.deleting')}...
                  </>
                ) : t('edit.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && selectedMediaUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeMediaViewer}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full transform transition-all duration-300">
            <img
              src={selectedMediaUrl}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg transform transition-transform duration-200 hover:scale-110"
              onClick={closeMediaViewer}
              aria-label="Close image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && selectedMediaUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeMediaViewer}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full transform transition-all duration-300">
            <video
              src={selectedMediaUrl}
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg shadow-2xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg transform transition-transform duration-200 hover:scale-110"
              onClick={closeMediaViewer}
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
    </div>
  );
};

export default JobEdit;
