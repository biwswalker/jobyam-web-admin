import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { 
  getTemplatePlanById, 
  updateTemplatePlan, 
  type TemplatePlan 
} from '../../services/templatePlanService';
import { t } from '~/locales';
import { useLanguage } from '../../components/DashboardLayout';

interface JobType {
  id: string;
  name: string;
}

interface JobTypesResponse {
  data: JobType[];
}

export default function EditTemplatePlan() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    planName: string;
    planDetail: string;
    jobType: string[];
    sequence: number;
    status: boolean;
  }>({
    planName: '',
    planDetail: '',
    jobType: [],
    sequence: 1,
    status: true
  });
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  // Fetch job types and template plan data
  useEffect(() => {
    const fetchData = async () => {
      console.log(id);
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch job types first
        const jobTypesResponse = await api.get<JobTypesResponse>('jobs/types');
        console.log(jobTypesResponse);
        if (jobTypesResponse.code === 200 && jobTypesResponse.data.data) {
          // Transform the job types to match the expected format
          const formattedJobTypes = jobTypesResponse.data.data.map((jobType: any) => ({
            id: jobType.id,
            name: jobType.name,
            subName: jobType.subName
          }));
          
          setJobTypes(formattedJobTypes);
          
          // Then fetch the template plan data
          const templateResponse = await getTemplatePlanById(id);
          
          if (templateResponse.code === 200 && templateResponse.data) {
            // Get the job type objects from the template
            const jobTypeData = templateResponse.data.jobType || [];
            const jobTypeObjects = Array.isArray(jobTypeData) 
              ? jobTypeData 
              : jobTypeData ? [jobTypeData] : [];
            
            // Extract just the IDs from the job type objects
            const jobTypeIds = jobTypeObjects.map(jobType => 
              typeof jobType === 'object' && jobType !== null ? jobType.id : jobType
            ).filter(Boolean); // Remove any null/undefined values
            
            // Get the full job type objects that match the IDs from the template
            const selectedJobTypes = formattedJobTypes.filter((jobType: JobType) => 
              jobTypeIds.some(id => String(id) === String(jobType.id))
            );
                        
            setFormData({
              planName: templateResponse.data.planName || '',
              planDetail: templateResponse.data.planDetail || '',
              jobType: jobTypeIds, // Use the extracted IDs
              sequence: templateResponse.data.sequence || 1,
              status: templateResponse.data.status ?? true
            });
          } else {
            throw new Error(templateResponse.message || t('failedToLoadData', language));
          }
        } else {
          throw new Error(t('failedToLoadData', language));
        }

      } catch (error) {
        setError(t('failedToLoadData', language));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sequence' ? parseInt(value) || 0 : value
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
    
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateTemplatePlan(id, {
        ...formData,
        id // Make sure to include the ID in the update
      });
      
      if (response.code === 200) {
        navigate('/templateplans', { state: { message: t('updatedSuccessfully', language) } });
      } else {
        throw new Error(response.message || t('failedToUpdatePlan', language));
      }
    } catch (error) {
      setError(t('failedToUpdatePlan', language));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="w-full p-2">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/templateplans')}
          className="flex items-center cursor-pointer text-gray-600 hover:text-gray-800 mr-4"
        >
          <FiArrowLeft className="mr-2" /> {t('backToList', language)}
        </button>
        <h1 className="text-2xl font-bold">{t('editTemplatePlan', language)}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="planName">
            {t('planName', language)}
          </label>
          <input
            type="text"
            id="planName"
            name="planName"
            value={formData.planName}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="planDetail">
            {t('planDetails', language)}
          </label>
          <textarea
            id="planDetail"
            name="planDetail"
            value={formData.planDetail}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t('jobTypes', language)}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {jobTypes.map((jobType: JobType) => (
              <div key={jobType.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`job-type-${jobType.id}`}
                  checked={formData.jobType.includes(jobType.id)}
                  onChange={() => handleCheckboxChange(jobType.id)}
                  className="h-4 w-4 cursor-pointer text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`job-type-${jobType.id}`} className="ml-2 block text-sm cursor-pointer text-gray-700">
                  {jobType.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
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

        <div className="flex items-center mb-6">
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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/templateplans')}
            className="bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {t('cancel', language)}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center"
          >
            {loading ? (
              t('saving', language)
            ) : (
              <>
                <FiSave className="mr-2" /> {t('saveChanges', language)}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}