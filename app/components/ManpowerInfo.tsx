import React from 'react';
import type { ApiResponse } from '../services/api';
import type { UserData, Manpower } from '../types';
import { t } from '~/locales';
import { useLanguage } from './DashboardLayout';

// Re-export Manpower type for other components
export type { Manpower };

interface ManpowerInfoProps {
  userData: UserData | null;
  manpower: Manpower | null;
  manpowerLoading: boolean;
  manpowerError: Error | null;
  updateManpower: (manpowerId: string, updatedData: Partial<Manpower>) => Promise<ApiResponse<Manpower>>;
  setManpower: React.Dispatch<React.SetStateAction<Manpower | null>>;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ManpowerInfo({
  userData,
  manpower,
  manpowerLoading,
  manpowerError,
  updateManpower,
  setManpower,
  setIsEditModalOpen,
}: ManpowerInfoProps) {
  const { language } = useLanguage();
  if (userData?.role?.name !== 'manpower') return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-8">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-[var(--color-primary,#0038A8)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-primary,#0038A8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 01-1-1h-2a1 1 0 01-1-1v-5m-4 0h4" />
            </svg>
            ข้อมูลผู้ให้บริการแรงงาน
          </h3>
        </div>
        <div className="flex">
          <button
            type="button"
            className="px-4 py-2 cursor-pointer bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            แก้ไข
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {manpowerLoading ? (
          <div className="animate-pulse">
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('name', language)}</div>
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('address', language)}</div>
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('contract', language)}</div>
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('contract_number', language)}</div>
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('status', language)}</div>
              <div className="w-2/3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ) : manpowerError ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('error', language)}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{typeof manpowerError === 'string' ? manpowerError : 'Error loading manpower data'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('name', language)}</div>
              <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.name || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('contract_number', language)}</div>
              <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.contractNumber || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('contract', language)}</div>
              <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.contract || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('detail', language)}</div>
              <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.detail || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('certificate', language)}</div>
              <div className="w-2/3 text-sm font-medium text-blue-700">
                {manpower?.certificate
                  ? (
                    <a
                      href={`${import.meta.env.VITE_API_URL_MEDIA}${manpower.certificate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900"
                    >
                      ดูไฟล์
                    </a>
                  )
                  : '-'}
              </div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('location', language)}</div>
              <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.location || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('address', language)}</div>
              <div className="w-2/3 text-sm font-medium text-gray-900">{manpower?.address || '-'}</div>
            </div>
            <div className="flex">
              <div className="w-1/3 text-sm font-medium text-gray-500">{t('status', language)}</div>
              <div className="w-2/3">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${manpower?.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {manpower?.status ? t('active', language) : t('inactive', language)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
