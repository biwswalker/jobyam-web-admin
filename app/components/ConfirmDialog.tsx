import React from 'react';
import { t } from '../locales';
import { useLanguage } from '~/components/DashboardLayout';


interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  fromName?: string;
  toName?: string;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, fromName, toName }: ConfirmDialogProps) {
  const { language } = useLanguage();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred and colored animated background */}
      <div className="absolute inset-0 backdrop-blur-[6px] bg-gradient-to-br from-teal-400/40 via-blue-400/30 to-purple-500/40 animate-gradient-move">
        <div className="absolute inset-0 bg-blue bg-opacity-30" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-2xl px-8 pt-8 pb-6 w-full max-w-xs text-center overflow-hidden border border-teal-100">
        {/* Fun accent icon */}
        <div className="flex justify-center -mt-4 mb-2">
          <div className="bg-gradient-to-br from-teal-400 via-blue-400 to-purple-500 p-2 rounded-full shadow-lg animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
        </div>
        {title && <h3 className="text-lg font-bold mb-2 text-teal-600 drop-shadow">{title}</h3>}
        {fromName && (
          <div className="text-xs mb-2 text-gray-500 animate-fade-in">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              <span>{t('move_from', language)} <span className="font-semibold text-blue-700">{fromName}</span> {t('to_new_admin', language)} <span className="font-semibold text-blue-700">{toName}</span></span>
            </span>
          </div>
        )}
        <p className="text-gray-800 mb-6 animate-fade-in-slow">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-2 cursor-pointer rounded bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all"
            onClick={onConfirm}
          >
            {t('confirm', language)}
          </button>
          <button
            className="px-4 py-2 cursor-pointer rounded bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
            onClick={onCancel}
          >
            {t('cancel', language)}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 8s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease;
        }
        .animate-fade-in-slow {
          animation: fadeIn 1.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
