import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiCheckCircle, FiUpload } from 'react-icons/fi';
import api from '../../services/api';
import { t } from '~/locales';
import { useLanguage } from '../../components/DashboardLayout';
import { createDocument, getDocumentById, updateDocument } from '../../services/preparedocuments';
interface Template {
    id: string;
    name: string;
}

interface FormData {
    name: string;
    description: string;
    seq: number;
    sampleDoc: string;
    formTemplates: string;
    fileDownload: File | null;
    templateId: string;
}

interface EditDocumentProps {
  params: {
    id: string;
  };
}

export default function EditDocument({ params }: EditDocumentProps) {
  const { id } = params;
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { language } = useLanguage();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        seq: 1,
        sampleDoc: '',
        formTemplates: '',
        fileDownload: null,
        templateId: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                setError(t('fileTooLarge', language, { size: 10 }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                fileDownload: file
            }));

            // Create preview if it's an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const removeFile = () => {
        setFormData(prev => ({
            ...prev,
            fileDownload: null
        }));
        setFilePreview(null);
        const fileInput = document.getElementById('fileDownload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError(t('documentNameRequired', language));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const formDataToSend = new FormData();

            // Add file if exists - match cURL format
            if (formData.fileDownload) {
                formDataToSend.append('file', formData.fileDownload);
                formDataToSend.append('fileDownload', formData.fileDownload.name);
            }

            // Add other form fields - match cURL field names exactly
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('sampleDoc', formData.sampleDoc || 'sample_document.pdf');
            formDataToSend.append('formTemplates', formData.formTemplates || formData.templateId);
            formDataToSend.append('seq', formData.seq.toString());

            const response = await updateDocument(id, formDataToSend)
            
            if (response && response.message === 'Document updated successfully') {
                setShowSuccessModal(true);
                setTimeout(() => {
                    navigate('/preparedocuments');
                }, 1500);
            } else {
                const errorMessage = response?.message || t('updateDocumentFailed', language);
                setError(errorMessage);
            }

        } catch (error: any) {
            console.error('Error in handleSubmit:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               t('createDocumentFailed', language);
            setError(errorMessage);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // Fetch document data and templates when component mounts
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Fetch document data if in edit mode
          if (id) {            
            try {
              const response = await getDocumentById(id);              
              if (!response || !response.data) {
                throw new Error('Invalid document data received from server');
              }
              
              const doc = response.data;              
              // Set form data with proper fallbacks
              const formDataUpdate = {
                name: doc?.name || '',
                description: doc?.description || '',
                seq: doc?.seq || 1,
                sampleDoc: doc?.sampleDoc || '',
                formTemplates: doc?.formTemplates || '',
                templateId: doc?.formTemplates || ''
              };
              
              setFormData(prev => ({
                ...prev,
                ...formDataUpdate
              }));
              
              // If there's a file download URL, set it as preview
              if (doc?.fileDownload) {
                setFilePreview(doc.fileDownload);
              }
            } catch (error) {
              setError(t('failedToLoadDocument', language));
              throw error; // Re-throw to be caught by the outer catch
            }
          }
          
          // Fetch templates for the template selector
          const templatesResponse = await api.get('master/template/plans/select');
          setTemplates(Array.isArray(templatesResponse.data) ? templatesResponse.data : []);
          
        } catch (error) {
          setError(t('failedToLoadDocument', language));
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [id, language]);

    return (
        <div className="w-full p-2">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/preparedocuments')}
                    className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
                >
                    <FiArrowLeft className="mr-2" />
                    {t('back', language)}
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {id ? t('editDocument', language) : t('createNewDocument', language)}
                </h1>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sequence */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('sequence', language)}
                        </label>
                        <input
                            type="number"
                            name="seq"
                            value={formData.seq}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Document Name */}
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('documentName', language)} *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Template */}
                    <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('templatePlans', language)} *
                        </label>
                        <select
                            name="templateId"
                            value={formData.templateId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="">{t('selectTemplate', language)}</option>
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('description', language)}
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* File Upload */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('fileUpload', language)}
                        </label>
                        <div className="mt-1 flex items-center">
                            <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <FiUpload className="inline mr-2" />
                                {t('chooseFile', language)}
                                <input
                                    id="fileDownload"
                                    name="fileDownload"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                            </label>
                            {formData.fileDownload && (
                                <div className="ml-4 flex items-center">
                                    <span className="text-sm text-gray-700 truncate max-w-xs">
                                        {formData.fileDownload.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="ml-2 text-red-600 hover:text-red-800"
                                        title={t('removeFile', language)}
                                    >
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {filePreview && (
                            <div className="mt-2">
                                <div className="text-sm text-gray-500 mb-1">{t('preview', language)}:</div>
                                {filePreview.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) ? (
                                    <img
                                        src={filePreview}
                                        alt={t('preview', language)}
                                        className="max-h-40 max-w-full rounded-md border border-gray-200 object-contain"
                                        onError={(e) => {
                                            // Fallback to link if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            const link = document.createElement('a');
                                            link.href = filePreview;
                                            link.target = '_blank';
                                            link.rel = 'noopener noreferrer';
                                            link.className = 'text-blue-600 hover:underline';
                                            link.textContent = t('viewFile', language) || 'View File';
                                            e.currentTarget.parentNode?.appendChild(link);
                                        }}
                                    />
                                ) : filePreview.match(/\.(pdf)$/i) ? (
                                    <div className="flex items-center space-x-2">
                                        <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        <a 
                                            href={filePreview} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {t('viewPdf', language) || 'View PDF'}
                                        </a>
                                    </div>
                                ) : (
                                    <a 
                                        href={filePreview} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                        download
                                    >
                                        {t('downloadFile', language) || 'Download File'}
                                    </a>
                                )}
                            </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            {t('supportedFormats', language)}
                        </p>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/preparedocuments')}
                        className="px-4 cursor-pointer py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {t('cancel', language)}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 cursor-pointer py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t('updating', language) + '...' : t('update', language)}
                    </button>
                </div>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <FiCheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {t('success', language)}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {t('documentUpdatedSuccessfully', language)}
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/preparedocuments')}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('close', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}