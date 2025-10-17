import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import type { ApiResponse } from '../services/api';
import type { Manpower } from '../types';
import { t } from '~/locales';
import { useLanguage } from './DashboardLayout';

interface ManpowerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  manpower: Manpower | null;
  onUpdate: (manpowerId: string, updatedData: Partial<Manpower>) => Promise<ApiResponse<Manpower>>;
}

export default function ManpowerEditModal({
  isOpen,
  onClose,
  manpower,
  onUpdate,
}: ManpowerEditModalProps) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<Partial<Manpower>>({
    name: '',
    address: '',
    detail: '',
    contract: '',
    contractNumber: '',
    certificate: '',
    location: '',
    status: true,
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('กรุณาอัพโหลดไฟล์ PDF เท่านั้น');
        e.target.value = '';
        setCertificateFile(null);
        return;
      }
      setCertificateFile(file);
      setError(null);
    }
  };

  useEffect(() => {
    if (manpower) {
      setFormData({ ...manpower });
    }
  }, [manpower]);

  useEffect(() => {
    if (manpower) {
      setFormData({
        ...manpower,
        status: manpower.status || true,
      });
    }
  }, [manpower]);

  useEffect(() => {
    if (manpower) {
      setFormData({
        ...manpower,
        status: manpower.status || true,
      });
    }
  }, [manpower]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manpower?.id) return;

    try {
      await onUpdate(manpower.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating manpower:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary,#0038A8)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-primary,#0038A8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {t('edit_manpower', language)}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name', language)}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contract', language)}
                </label>
                <input
                  type="text"
                  id="contract"
                  name="contract"
                  value={formData.contract || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contract_number', language)}
                </label>
                <input
                  type="tel"
                  id="contractNumber"
                  name="contractNumber"
                  value={formData.contractNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="detail" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('detail', language)}
                </label>
                <input
                  type="text"
                  id="detail"
                  name="detail"
                  value={formData.detail || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="certificate" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('certificate', language)}
                </label>
                <input
                  type="file"
                  id="certificate"
                  name="certificate"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                )}
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('location', language)}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('address', language)}
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status"
                  name="status"
                  checked={formData.status || true}
                  onChange={handleCheckboxChange}
                  className="mr-2"
                />
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  {t('active', language)}
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel', language)}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary,#0038A8)] text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  {t('save', language)}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
