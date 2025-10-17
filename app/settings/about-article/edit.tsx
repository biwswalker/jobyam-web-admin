import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAboutArticles, updateAboutArticle } from '../../services/aboutArticleService';
import type { AboutArticle } from '../../services/aboutArticleService';
import { t } from '../../locales';
import { useLanguage } from '../../components/DashboardLayout';
import api, { type ApiResponse } from '~/services/api';
import type { ImageWithId } from '../../types';
import type { MediaPreview } from '~/model/jobs';

const EditAboutArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<AboutArticle | null>(null);
  const [deletingMedia, setDeletingMedia] = useState(false);

  const [form, setForm] = useState({
    TitleTH: '',
    TitleEN: '',
    ContentTH: '',
    ContentEN: '',
    ImageURL: '',
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAboutArticles()
      .then(res => {
        const found = res.data?.find((item: AboutArticle) => String(item.ID) === id);
        if (found) {
          setArticle(found);
          setForm({
            TitleTH: found.TitleTH || '',
            TitleEN: found.TitleEN || '',
            ContentTH: found.ContentTH || '',
            ContentEN: found.ContentEN || '',
            ImageURL: found.ImageURL || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleBack() {
    navigate(-1);
  }

  const API_URL = import.meta.env.VITE_API_URL_MEDIA;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<MediaPreview[]>([]);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    if (!id) {
      setError("No article ID provided.");
      setSaving(false);
      return;
    }
    try {
      // Prepare payload to match AboutArticle interface
      const now = new Date().toISOString();
      const payload = {
        TitleTH: form.TitleTH,
        TitleEN: form.TitleEN,
        ContentTH: form.ContentTH,
        ContentEN: form.ContentEN,
        Date: article?.Date || now,
        ImageURL: article?.ImageURL || '',
        UpdatedAt: now,
        TypeId: article?.TypeId || 1, // Default to 1 if not present
      };
      await updateAboutArticle(id, payload);
      setSuccess(t('save_success', language));
      navigate('/settings/aboutarticle');
    } catch (e) {
      setError(t('save_failed', language));
    } finally {
      setSaving(false);
    }
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.filter((file) => file.type.startsWith("image/"));

    // Clear previous error
    setImageUploadError(null);

    if (newImages.length === 0) {
      return;
    }

    // Check file sizes before upload
    let oversizedFiles = newImages.filter(file => file.size > 10 * 1024 * 1024); // > 10MB
    if (oversizedFiles.length > 0) {
      setImageUploadError(`${oversizedFiles.length} ${t('image_size_limit', language)}`);
      return;
    }

    // Show loading indicator
    setUploadingImage(true);

    // Process and upload each new image
    Promise.all(newImages.map(async (file) => {
      try {
        // Create form data for this specific image
        const formData = new FormData();
        formData.append("images", file);

        // Upload image to the backend immediately
        const response = await api.post<ApiResponse<ImageWithId[]>>(`abouts/update/image/${id}`, formData);

        if (response.code === 200 && response.status === 'OK' && Array.isArray(response.data) && response.data.length > 0) {
          if (article) {
            setArticle({
              ...article,
              ID: article.ID ?? id ?? '',
              TitleTH: article.TitleTH ?? '',
              TitleEN: article.TitleEN ?? '',
              Date: article.Date ?? '',
              ContentTH: article.ContentTH ?? '',
              ContentEN: article.ContentEN ?? '',
              CreatedAt: article.CreatedAt ?? '',
              UpdatedAt: article.UpdatedAt ?? '',
              TypeId: article.TypeId ?? 0,
              ImageURL: response.data[0].ImageURL || response.data[0].ImageURL,
            });
          }
          // Get the first uploaded image from the array
          const uploadedImage = response.data[0];

          // Get the image URL from the response (handle both property names)
          const imageUrl = uploadedImage.imageUrl || uploadedImage.imageURL;

          if (!imageUrl) {
            console.error('Image URL not found in response:', uploadedImage);
            return null;
          }

          // Create a preview with the returned data
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
      // Check for errors
      const failedUploads = results.filter(result => result && 'error' in result) as { error: boolean, fileName: string }[];
      if (failedUploads.length > 0) {
        const fileNames = failedUploads.map(item => item.fileName).join(", ");
        setImageUploadError(`${t('error', language)}: ${fileNames} (${t('image_size_limit', language)})`);
      }

      // Filter out any failed uploads
      const successfulUploads = results.filter(result => result && !('error' in result)) as MediaPreview[];

      // Add new images to existing previews
      if (successfulUploads.length > 0) {
        setNewImagePreview(prev => [...prev, ...successfulUploads]);
      }
      setUploadingImage(false);
    });
  }, [id]);

  const handleViewImage = (url: string) => {
    setSelectedMediaUrl(url);
    setShowImageViewer(true);
  };

  const closeMediaViewer = () => {
    setShowImageViewer(false);
    setSelectedMediaUrl(null);
  };

  return (
    <div className="relative z-10 w-full bg-white/80 backdrop-blur-xl border border-white/40">
      <h2 className="text-3xl font-bold mb-8 text-teal-700 flex items-center gap-2">
        {t('edit_about_article', language)}
      </h2>
      {loading ? (
        <div className="text-center text-lg text-gray-500 py-12">{t('loading', language)}</div>
      ) : (
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          onSubmit={e => { e.preventDefault(); handleSave(); }}
        >
          <div className="space-y-6">
            <div>
              <label className="block font-semibold mb-2 text-teal-700">{t('title', language)} (TH)</label>
              <input
                className="border border-teal-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all duration-200 bg-white/90 shadow-sm text-lg"
                name="TitleTH"
                value={form.TitleTH}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-teal-700">{t('content', language)} (TH)</label>
              <textarea
                className="border border-teal-200 rounded-lg px-4 py-2 w-full min-h-[700px] focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all duration-200 bg-white/90 shadow-sm text-lg"
                name="ContentTH"
                value={form.ContentTH}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block font-semibold mb-2 text-teal-700">{t('title', language)} (EN)</label>
              <input
                className="border border-teal-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all duration-200 bg-white/90 shadow-sm text-lg"
                name="TitleEN"
                value={form.TitleEN}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-teal-700">{t('content', language)} (EN)</label>
              <textarea
                className="border border-teal-200 rounded-lg px-4 py-2 w-full min-h-[700px] focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all duration-200 bg-white/90 shadow-sm text-lg"
                name="ContentEN"
                value={form.ContentEN}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('image', language)}
            </label>
            <div className="mt-1 flex flex-col md:flex-row gap-4 md:gap-8 items-start">
              {/* Upload box */}
              <div className="space-y-6 flex justify-center px-4 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-teal-500 transition-colors min-w-0 w-full md:min-w-[320px] md:w-auto">
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
                  <div className="flex flex-row items-center justify-center text-sm text-gray-600 gap-2">
                    <label
                      htmlFor="images"
                      className="relative cursor-pointer bg-teal-50 rounded-md font-medium text-teal-600 hover:text-teal-500 py-2 px-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500 flex items-center"
                      style={{ marginBottom: 0 }}
                    >
                      <span>{t('upload_image', language)}</span>
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
                    {t('image_size_limit', language)}
                  </p>
                  {imageUploadError && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded-lg">
                      <span className="font-medium">{t('error', language)}:</span> {imageUploadError}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {t('or_drag_and_drop', language)}
                  </p>
                </div>
              </div>
              {/* Preview box */}
              <div className="flex flex-col space-y-6 min-w-0 w-full md:min-w-[120px] md:w-auto">
                {/* Loading indicator for images */}
                {uploadingImage && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    <span className="ml-2 text-sm text-gray-600">{t('uploading_image', language)}</span>
                  </div>
                )}
                {article?.ImageURL && (
                  <div className="relative">
                    <img
                      src={import.meta.env.VITE_API_URL_MEDIA + article?.ImageURL}
                      alt={`Preview`}
                      className="w-full max-w-[180px] h-auto md:h-47 md:w-47 object-cover rounded-lg cursor-pointer"
                      onClick={() => handleViewImage(import.meta.env.VITE_API_URL_MEDIA + article?.ImageURL)}
                    />
                    {/* <button
                      type="button"
                      onClick={() => handleDeleteButtonClick('image', 0)}
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
                    </button> */}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-4 justify-end pt-4">
            {success && <div className="text-green-600 font-semibold text-center py-2 flex-1">{success}</div>}
            {error && <div className="text-red-600 font-semibold text-center py-2 flex-1">{error}</div>}
            <button
              type="button"
              className="bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-bold shadow transition-all duration-200 focus:ring-2 focus:ring-teal-300"
              onClick={handleBack}
              disabled={saving}
            >
              {t('back', language)}
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r cursor-pointer from-teal-500 to-blue-400 text-white px-8 py-2 rounded-lg font-bold shadow hover:from-teal-400 hover:to-blue-500 transition-all duration-200 focus:ring-2 focus:ring-teal-300 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? t('saving', language) : t('save', language)}
            </button>
          </div>
        </form>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && selectedMediaUrl && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeMediaViewer}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full transform transition-all duration-300">
            <img
              src={selectedMediaUrl}
              alt="Enlarged view"
              className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg shadow-2xl"
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
    </div>
  );
};

export default EditAboutArticle;
function setSelectedMediaUrl(url: string) {
  throw new Error('Function not implemented.');
}

