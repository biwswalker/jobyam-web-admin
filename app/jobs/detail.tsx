import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from 'react-modal';
import { useLanguage1 } from '../context/LanguageContext';
import MapSection from '../components/MapSection';
const API_URL = import.meta.env.VITE_API_URL_MEDIA;

interface Job {
  id: string;
  title: string;
  titleMedia: string;
  jobSalary: string;
  jobDate: string;
  jobTime: string;
  description: string;
  address: string;
  companyName: string;
  acceptingPosition: number;
  images: string[];
  videos: string[];
  status: boolean;
  isLike?: boolean;
  jobTypeName?: string;
  qualifications: string;
  candidateCriteria: string;
  location: string;
  workingHoursPerWeek: number,
  jobManpowerDetail?: {
    name?: string;
    certificate?: string;
  };
}

const mapJobData = (job: any): Job => {
  if (!job) return job;

  return {
    ...job,
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

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>('');
  const [jobDetail, setJobDetail] = useState<Job | null>(null);
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);

  const navigate = useNavigate();
  const { t } = useLanguage1();

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

      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }

      .scale-up-center {
        animation: scaleUpCenter 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const response = await api.get<Job>(`jobs/${id}`);

        if (!response || !response.data) {
          throw new Error("Invalid API response structure");
        }

        // Check the correct API structure
        if (response.code === 200 && response.status === 'OK') {
          if (response.data) {
            // Transform the data using mapJobData
            const mappedJobData = mapJobData(response.data);

            setJob(mappedJobData);
            setJobDetail(mappedJobData);

            // Parse location coordinates from response
            if (mappedJobData.location) {
              try {
                const locationParts = mappedJobData.location.split(',');
                if (locationParts.length === 2) {
                  const latitude = parseFloat(locationParts[0].trim());
                  const longitude = parseFloat(locationParts[1].trim());

                  if (!isNaN(latitude) && !isNaN(longitude)) {
                    setLat(latitude);
                    setLng(longitude);
                  } else {
                    setLat(31.7683);
                    setLng(35.2137);
                  }
                } else {
                  setLat(31.7683);
                  setLng(35.2137);
                }
              } catch (error) {
                setLat(31.7683);
                setLng(35.2137);
              }
            } else {
              setLat(31.7683);
              setLng(35.2137);
            }
          } else {
            throw new Error('No job data received');
          }
        } else {
          console.error("API returned:", {
            code: response.code,
            status: response.status
          });
          throw new Error(`Failed to fetch job details: Status ${response.status}, Code ${response.code}`);
        }
      } catch (err) {
        console.error("Error in fetchJobDetail:", err);
        let errorMessage = 'Failed to fetch job details';

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = String(err.message);
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetail();
    } else {
      setError("No job ID provided");
      setLoading(false);
    }
  }, [id]);

  // Helper functions
  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const handleImageClick = (url: string) => {
    if (isVideoFile(url)) {
      setSelectedVideoUrl(url);
      setSelectedImage(null);
      setIsVideoPlaying(true); // เล่นวิดีโอทันที
    } else {
      setSelectedImage(url);
      setSelectedVideoUrl(null);
    }
    setIsImageModalOpen(true);
  };

  useEffect(() => {
    if (isImageModalOpen && selectedVideoUrl && isVideoPlaying) {
      const timer = setTimeout(() => {
        const videoElement = document.querySelector('video[src="' + selectedVideoUrl + '"]') as HTMLVideoElement;
        if (videoElement) {
          videoElement.play().catch(err => {
            console.log('Delayed video autoplay failed:', err);
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isImageModalOpen, selectedVideoUrl, isVideoPlaying]);

  const handlePdfClick = (url: string) => {
    setSelectedPdfUrl(url);
    setIsPdfModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">กำลังโหลด...</div>;
  }

  if (error || !job) {
    return <div className="text-red-500 text-center p-4">{error || 'ไม่พบข้อมูลงาน'}</div>;
  }

  return (
    <>
      <div className="w-full">

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

        {/* Modal for displaying enlarged images or videos */}
        <Modal
          isOpen={isImageModalOpen}
          onAfterOpen={() => {
            if (selectedVideoUrl && isVideoPlaying) {
              setTimeout(() => {
                const videoElement = document.querySelector('video[src="' + selectedVideoUrl + '"]') as HTMLVideoElement;
                if (videoElement) {
                  videoElement.play().catch(err => {
                    console.log('Modal after open video play failed:', err);
                  });
                }
              }, 100);
            }
          }}
          onRequestClose={() => {
            setIsImageModalOpen(false);
            setIsVideoPlaying(false);
            setSelectedVideoUrl(null);
          }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-transparent"
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }
          }}
          ariaHideApp={false}
        >
          <div className="relative max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-xl">
            <button
              className="absolute top-4 right-4 p-2 bg-black text-white rounded-full hover:bg-gray-800 focus:outline-none transition-all duration-300 transform hover:scale-110 z-50"
              onClick={() => {
                setIsImageModalOpen(false);
                setIsVideoPlaying(false);
                setSelectedVideoUrl(null);
              }}
              style={{
                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✖
            </button>

            {selectedVideoUrl ? (
              <video
                key={`modal-video-${selectedVideoUrl}`}
                src={selectedVideoUrl}
                controls
                autoPlay
                muted
                playsInline
                className="w-full max-h-[80vh] object-contain rounded-lg"
                style={{ backgroundColor: '#000' }}
                onLoadStart={(e) => {
                  const video = e.currentTarget;
                  if (isVideoPlaying) {
                    video.play().catch(err => console.log('Video load start play failed:', err));
                  }
                }}
                onCanPlay={(e) => {
                  const video = e.currentTarget;
                  if (isVideoPlaying) {
                    video.play().catch(err => console.log('Video can play failed:', err));
                  }
                }}
                onError={(e) => console.error("Video error:", e)}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <img
                src={selectedImage || undefined}
                alt={t("jobDetail.expandedImage")}
                className="w-full max-h-[80vh] object-contain rounded-lg transition-all duration-500 ease-in-out hover-shadow-custom"
              />
            )}
          </div>
        </Modal>

        <div className="p-4 mx-auto flex flex-col md:flex-row gap-6" style={{ marginTop: '20px', backgroundColor: '#fff' }}>
          {/* Image Section */}
          <div className="w-full pr-4">
            <div className="w-full pr-4">
              {jobDetail?.images && jobDetail.images.length > 0 ? (
                <>
                  {/* Main image - show the first image from the images array */}
                  <div className="w-full mb-6 relative">
                    {isVideoFile(jobDetail.titleMedia) ? (
                      <div className="w-full aspect-video relative rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out hover-shadow-custom"
                        onClick={() => handleImageClick(jobDetail.titleMedia || "")}>
                        <video
                          src={jobDetail.titleMedia}
                          muted
                          className="w-full h-full object-cover"
                          onLoadedData={(e) => {
                            const video = e.currentTarget;
                            video.play().catch(() => console.log('Auto-play prevented by browser'));
                            setTimeout(() => {
                              video.pause();
                            }, 1000);
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={jobDetail.titleMedia}
                        alt={t("jobDetail.selectedImage")}
                        className="w-full aspect-video object-cover rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover-shadow-custom"
                        onClick={() => handleImageClick(jobDetail.titleMedia || "")}
                      />
                    )}

                    {isVideoFile(jobDetail.images[0]) && !isVideoFile(jobDetail.titleMedia) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional images grid */}
                  <div className="grid grid-cols-4 gap-4">
                    {jobDetail.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${t("jobDetail.thumbnail")} ${index + 1}`}
                        className="aspect-square object-cover rounded-lg cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-110 hover-shadow-custom"
                        onClick={() => handleImageClick(img)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full mb-6">
                  <img
                    src={jobDetail?.titleMedia || "https://via.placeholder.com/800x450?text=No+Image+Available"}
                    alt={t("jobDetail.selectedImage")}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Videos Section */}
            <div className="mt-10">
              <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.recommendedVideos")}</h2>
              <div className="grid grid-cols-4 gap-4" style={{ marginTop: '20px' }}>
                {jobDetail?.videos && jobDetail.videos.map((video, index) => (
                  <div
                    key={`video-${index}`}
                    className="relative cursor-pointer"
                    onClick={() => handleImageClick(video)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-lg">
                      <div className="video-preview-container w-full h-full">
                        <video
                          src={video}
                          muted
                          loop={false}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover video-shake playing"
                          onLoadedData={(e) => {
                            const video = e.currentTarget;
                            video.play().catch(() => console.log('Auto-play prevented by browser'));
                            video.classList.add('playing');
                            if (video.duration > 0) {
                              video.currentTime = Math.random() * (video.duration * 0.7);
                            }
                            setTimeout(() => {
                              video.pause();
                              video.classList.remove('playing');
                            }, 1000);
                          }}
                          onEnded={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.classList.remove('playing');
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!jobDetail?.videos || jobDetail.videos.length === 0) && (
                  <div className="col-span-4 py-8 text-center text-gray-500">
                    {t("jobDetail.noVideosAvailable")}
                  </div>
                )}
              </div>
            </div>

            {/* License Documents Section */}
            <div className="mt-10">
              <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.licenseDocuments")}</h2>
              {jobDetail?.jobManpowerDetail?.certificate ? (
                <div
                  className="mt-5 cursor-pointer"
                  onClick={() => handlePdfClick(jobDetail.jobManpowerDetail?.certificate || "")}
                >
                  <div className="relative w-[200px] h-[200px] rounded-lg overflow-hidden border border-gray-300 transition-transform duration-300 ease-in-out transform hover:scale-110 hover-shadow-custom">
                    <object
                      data={`${jobDetail.jobManpowerDetail.certificate}#page=1&view=FitH`}
                      type="application/pdf"
                      className="w-full h-full object-cover"
                    >
                      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">{t("jobDetail.licenseDocuments")}</p>
                      </div>
                    </object>
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white px-2 py-1 text-xs rounded-tl-md">
                      {t("jobDetail.preview")}
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  key={20000}
                  src={"/articlesImg//certificate.webp"}
                  height={200}
                  width={200}
                  style={{ marginTop: '20px' }}
                  alt={t("jobDetail.certificateImage")}
                  className="aspect-square object-cover rounded-lg cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-110 hover-shadow-custom"
                  onClick={() => handleImageClick("/articlesImg//certificate.webp")}
                />
              )}
            </div>
          </div>

          {/* Job Details Section */}
          <div className="w-full md:w-2/2 p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl text-[#0038A8]" style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {jobDetail?.title || t("jobDetail.defaultJobTitle")}
              </h1>
            </div>
            <p className="text-gray-600" style={{ fontSize: '18px', fontWeight: 'bold' }}>{jobDetail?.jobManpowerDetail?.name}</p>
            <div className="flex flex-col space-y-2 mt-2">
              <p className="text-black text-sm" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {t("jobDetail.positionsAvailable", { count: jobDetail?.acceptingPosition })}
              </p>
            </div>
            <div className="border-t border-gray-300 my-4"></div>
            <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.jobDetails")}</h2>
            <p className="text-gray-600" style={{ fontSize: '18px' }}>
              {t("jobDetail.jobType")}: <span>{jobDetail?.jobTypeName}</span>
            </p>
            <p className="text-gray-600" style={{ fontSize: '18px' }}>
              {t("jobDetail.salaryStart")}: <span>{jobDetail?.jobSalary}</span>
            </p>
            <p className="text-gray-600" style={{ fontSize: '18px' }}>
              {t("jobDetail.workingHoursPerWeek", { count: jobDetail?.workingHoursPerWeek })}
            </p>
            {/* <p className="text-gray-600" style={{ fontSize: '18px' }}>
              {t("jobDetail.workDays")}: <span>{jobDetail?.jobDate}</span>
            </p>
            <p className="text-gray-600" style={{ fontSize: '18px' }}>
              {t("jobDetail.workHours")}: <span>{jobDetail?.jobTime}</span>
            </p> */}
            <div className="border-t border-gray-300 my-4"></div>
            <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.description")}</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              {jobDetail?.description.split("\n").map((item, index) => (
                <li key={index} style={{ fontSize: '18px' }}>{item}</li>
              ))}
            </ul>
            <div className="border-t border-gray-300 my-4"></div>
            <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.qualifications")}</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              {jobDetail?.qualifications.split("\n").map((item, index) => (
                <li key={index} style={{ fontSize: '18px' }}>{item}</li>
              ))}
            </ul>
            <div className="border-t border-gray-300 my-4"></div>
            <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.candidateCriteria")}</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <span style={{ fontSize: '18px' }}>
                {jobDetail?.candidateCriteria.split("\n").map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </span>
            </ul>
            <div className="border-t border-gray-300 my-4"></div>
            <h2 className="text-lg text-[#0038A8]" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t("jobDetail.workLocation")}</h2>
            <p className="text-gray-600" style={{ fontSize: '18px' }}>{jobDetail?.address}</p>
            <MapSection lat={lat} lng={lng} />
          </div>
        </div>
      </div>

      {/* Modal for displaying full PDF */}
      <Modal
        isOpen={isPdfModalOpen}
        onRequestClose={() => setIsPdfModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center z-50 bg-transparent"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000
          },
          content: {
            position: 'relative',
            top: '50px',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            width: '90%',
            height: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            padding: 0,
            border: 'none',
            borderRadius: '0.5rem',
            background: 'transparent',
            overflow: 'hidden',
            margin: '0 auto'
          }
        }}
        ariaHideApp={false}
      >
        <div className="relative w-full h-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
            <h3 className="font-bold">{t("jobDetail.licenseDocuments")}</h3>
            <button
              className="p-2 bg-black text-white rounded-full hover:bg-gray-800 focus:outline-none"
              onClick={() => setIsPdfModalOpen(false)}
            >
              ✖
            </button>
          </div>

          <div className="flex-grow overflow-hidden">
            <iframe
              src={selectedPdfUrl}
              className="w-full h-full border-none"
              title={t("jobDetail.licenseDocuments")}
              style={{ minHeight: '80vh' }}
              allow="fullscreen"
            ></iframe>

            <div className="hidden sm:hidden">
              <a
                href={selectedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {t("jobDetail.openPdfExternally")}
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default JobDetail;
