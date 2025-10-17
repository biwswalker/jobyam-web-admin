import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { createTemplatePlan } from '../../services/templatePlanService';
import api from '../../services/api';
import { t } from '~/locales';
import { useLanguage } from '../../components/DashboardLayout';

interface JobType {
    id: string;
    name: string;
    subName?: string;
}

interface JobTypesResponse {
    data: JobType[];
}

export default function CreateTemplatePlan() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { language } = useLanguage();
    // Form state
    const [formData, setFormData] = useState({
        planName: '',
        planDetail: '',
        sequence: 1,
        status: true,
        jobType: [] as string[],
    });

    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Fetch job types on component mount
    useEffect(() => {
        const fetchJobTypes = async () => {
            try {
                const response = await api.get<JobTypesResponse>('jobs/types?limit=1000');

                if (response.code === 200 && response.data.data) {
                    const formattedJobTypes = response.data.data.map((jobType: any) => ({
                        id: jobType.id,
                        name: jobType.name,
                        subName: jobType.subName
                    }));

                    setJobTypes(formattedJobTypes);
                } else {
                    throw new Error(t('failedToLoadJobTypes', language));
                }
            } catch (err) {
                setError(t('failedToLoadJobTypes', language));
            }
        };

        fetchJobTypes();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleCheckboxChange = (jobTypeId: string) => {
        setFormData(prev => {
            const updatedJobTypes = prev.jobType.includes(jobTypeId)
                ? prev.jobType.filter(id => id !== jobTypeId)
                : [...prev.jobType, jobTypeId];

            return {
                ...prev,
                jobType: updatedJobTypes
            };
        });
    };

    const handleStatusToggle = () => {
        setFormData(prev => ({
            ...prev,
            status: !prev.status
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.planName.trim()) {
            setError(t('planNameIsRequired', language));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await createTemplatePlan({
                planName: formData.planName,
                planDetail: formData.planDetail,
                jobType: formData.jobType,
                sequence: Number(formData.sequence),
                status: formData.status
            });

            if (response.code === 201) {
                // Show success modal
                setShowSuccessModal(true);
            } else {
                setError(response.message || t('failedToCreateTemplatePlan', language));
            }
        } catch (err) {
            setError(t('failedToCreateTemplatePlan', language));
        } finally {
            setLoading(false);
        }
    };

    // Success Modal Component
    const SuccessModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <FiCheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('success', language)}</h3>
                        <p className="text-gray-600 mb-6">{t('templatePlanCreatedSuccessfully', language)}</p>
                        <div className="flex justify-center space-x-3 w-full">
                            <button
                                onClick={onConfirm}
                                className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                {t('backToList', language)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex cursor-pointer items-center text-gray-600 hover:text-gray-800 mr-4"
                >
                    <FiArrowLeft className="mr-1" /> {t('back', language)}
                </button>
                <h1 className="text-2xl font-bold">{t('createNewTemplatePlan', language)}</h1>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Plan Name */}
                    <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('planName', language)} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="planName"
                            value={formData.planName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter plan name"
                            required
                        />
                    </div>

                    {/* Plan Description */}
                    <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('description', language)}
                        </label>
                        <textarea
                            name="planDetail"
                            value={formData.planDetail}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter plan description"
                        />
                    </div>

                    {/* Job Types */}
                    <div className="col-span-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            {t('jobTypes', language)}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {jobTypes.map((jobType) => (
                                <div key={jobType.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`job-type-${jobType.id}`}
                                        checked={formData.jobType.includes(jobType.id)}
                                        onChange={() => handleCheckboxChange(jobType.id)}
                                        className="h-4 w-4 cursor-pointer text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`job-type-${jobType.id}`}
                                        className="ml-2 block text-sm cursor-pointer text-gray-700"
                                    >
                                        {jobType.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sequence */}
                    <div className="col-span-4 mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sequence">
                            {t('sequence', language)}
                        </label>
                        <input
                            type="number"
                            id="sequence"
                            name="sequence"
                            value={formData.sequence}
                            onChange={handleInputChange}
                            min="1"
                            className="shadow appearance-none border rounded w-32 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="col-span-4">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={formData.status}
                                    onChange={handleStatusToggle}
                                />
                                <div className={`block w-14 h-8 rounded-full ${formData.status ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${formData.status ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-gray-700 font-medium">
                                {formData.status ? 'Active' : 'Inactive'}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={loading}
                    >
                        {t('cancel', language)}
                    </button>
                    <button
                        type="submit"
                        className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? (
                            t('saving', language)
                        ) : (
                            <>
                                <FiSave className="mr-2 h-4 w-4" />
                                {t('savePlan', language)}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onConfirm={() => {
                    setShowSuccessModal(false);
                    navigate('/templateplans');
                }}
            />
        </div>
    );
}