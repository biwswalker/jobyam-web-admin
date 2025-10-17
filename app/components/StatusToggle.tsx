import React, { useState, useEffect } from 'react';
import statusService from '../services/statusService';

interface StatusToggleProps {
  id: string;
  initialStatus: boolean;
  type: 'job' | 'company' | 'jobType' | 'manpower';
  onStatusChange?: (newStatus: boolean) => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ 
  id, 
  initialStatus, 
  type,
  onStatusChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const newStatus = !initialStatus;
      const updateData = {
        status: newStatus,
        updatedBy: 'Admin'
      };

      let response;
      switch (type) {
        case 'job':
          response = await statusService.updateJobStatus(id, updateData);
          break;
        case 'company':
          response = await statusService.updateCompanyStatus(id, updateData);
          break;
        case 'jobType':
          response = await statusService.updateJobTypeStatus(id, updateData);
          break;
        case 'manpower':
          response = await statusService.updateManpowerStatus(id, updateData);
          break;
      }

      // Wait for response and check if it's successful
      const result = await response;
      if (result?.code === 200 && onStatusChange) {
        onStatusChange(newStatus);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      // You might want to show an error toast/notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        ${initialStatus ? 'bg-[var(--color-primary,#0038A8)]' : 'bg-gray-300'}
        transition-colors duration-200 ease-in-out
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow
          transition-transform duration-200 ease-in-out
          ${initialStatus ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
      <span className="sr-only">
        {initialStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
      </span>
    </button>
  );
};

export default StatusToggle;
