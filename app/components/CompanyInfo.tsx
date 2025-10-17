import React, { useEffect, useState } from 'react';
import { getCompanyById } from '../services/companies';
import type { Company } from '../services/companies';
import { useLanguage } from '~/components/DashboardLayout';
import { t } from '~/locales';

interface CompanyInfoProps {}

export default function CompanyInfo() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const userDataString = localStorage.getItem('jobyamUserAdmin');
        if (!userDataString) {
          setError('User data not found');
          return;
        }

        const userData = JSON.parse(userDataString);
        const companyId = userData.companyID;
        
        if (!companyId) {
          setError('Company ID not found');
          return;
        }

        const response = await getCompanyById(companyId);
        setCompany(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Unable to load company information');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{t('company_info', language)}</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500">{t('company_name', language)}</p>
            <p className="text-lg font-medium">{company.name}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{t('company_email', language)}</p>
            <p className="text-lg font-medium">{company.email}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t('company_address', language)}</p>
          <p className="text-lg font-medium">{company.address}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500">{t('status', language)}</p>
            <p className="text-lg font-medium text-green-600">{company.status ? t('active', language) : t('inactive', language)}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{t('created_at', language)}</p>
            <p className="text-lg font-medium">{new Date(company.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
