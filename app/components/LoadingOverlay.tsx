import React from 'react';
import { t } from '~/locales';
import { useLanguage } from './DashboardLayout';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-6 flex flex-col items-center space-y-4 border-2 border-[#0038A8]/50 animate-cyberpunk-border shadow-2xl">
        <div className="relative">
          {/* Outer rotating gear */}
          <svg className="animate-gear h-12 w-12 text-[#0038A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          {/* Inner rotating circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-[#0038A8]/50 animate-cyberpunk-border"></div>
          </div>
          {/* Glowing effect */}
          <div className="absolute inset-0 animate-glow rounded-full"></div>
        </div>
        <span className="text-white font-medium tracking-wider text-lg">{t('loading', language)}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
