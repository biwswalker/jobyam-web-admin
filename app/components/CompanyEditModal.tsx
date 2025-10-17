import React, { useState, useEffect } from 'react';
import { useLanguage } from './DashboardLayout';
import { t } from '~/locales';

interface CompanyEditModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCompany: Company) => void;
}

// Define Company type with correct status type
interface Company {
  id: string;
  name: string;
  address: string;
  email: string;
  status: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({ company, isOpen, onClose, onUpdate }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<Company>({
    id: '',
    name: '',
    address: '',
    email: '',
    status: true,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        ...company,
        status: company.status || true
      });
    }
  }, [company]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? 'active' : 'inactive'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      onUpdate(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('edit_company', language)}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('company_name', language)}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('company_email', language)}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('company_address', language)}
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleTextareaChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <span>{t('active', language)}</span>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 cursor-pointer py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('cancel', language)}
              </button>
              <button
                type="submit"
                className="px-4 cursor-pointer py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {t('save', language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyEditModal;
