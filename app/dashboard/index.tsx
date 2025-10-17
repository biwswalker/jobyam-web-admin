import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../services/dashboardService';
import LoadingOverlay from '../components/LoadingOverlay';
import { useLanguage } from '../components/DashboardLayout';
import { t as t } from '../locales';
interface JobTopTenItem {
  Interested: number;
  title: string;
  title_media: string;
}

export interface VisitorSummaryItem {
  date: string;
  application_count: number;
  website_count: number;
}

export interface DashboardData {
  Applicants: number;
  activity: number;
  activityDelayed: number;
  activitySuccess: number;
  jobTopTen: JobTopTenItem[];
  visitorsSummary: VisitorSummaryItem[];
}

const API_URL = import.meta.env.VITE_API_URL || '';
const API_URL_MEDIA = import.meta.env.VITE_API_URL_MEDIA || '';

// Summary Card Component
const SummaryCard: React.FC<{
  title: string;
  count: number;
  icon: string;
}> = ({ title, count, icon }) => {
  return (
    <div className="relative rounded-2xl min-h-[110px] p-6 bg-gradient-to-tr from-white/80 via-blue-50 to-pink-100 shadow-xl border border-white/40 overflow-hidden group hover:scale-[1.04] hover:shadow-2xl transition-all duration-300 font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-70 transition duration-300" style={{ background: 'radial-gradient(circle at 70% 30%, #c7d2fe33 0%, #fbc2eb22 100%)' }} />
      <div className="flex flex-row items-center h-full relative z-10">
        <div className="flex-1">
          <h3 className="text-neutral-500 text-base font-normal tracking-wide mb-2 antialiased">{title}</h3>
          <p className="text-5xl font-bold text-neutral-800 antialiased leading-tight tracking-tight">{count}</p>
        </div>
        <div className="ml-4 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-lg shadow-lg border-2 border-white flex items-center justify-center animate-[pulse_2.5s_ease-in-out_infinite] group-hover:scale-110 transition-transform duration-300">
            <span className="text-3xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Popular Job Card Component (Redesigned)
const rankColors = [
  "text-blue-600", // 1
  "text-cyan-500", // 2
  "text-sky-400",  // 3
];

const PopularJobCard: React.FC<{
  rank: number;
  title: string;
  interested: number;
  imageUrl: string;
  positions: number;
}> = ({ rank, title, interested, imageUrl, positions }) => {
  const rankColor = rank <= 3 ? rankColors[rank - 1] : "text-gray-400";
  const { language } = useLanguage();

  return (
    <div className="flex items-center py-2 border-b last:border-b-0 bg-white/70 hover:bg-gradient-to-r hover:from-blue-50 hover:to-pink-50 rounded-xl transition-all duration-200 group cursor-pointer">
      <div className={`w-8 flex-shrink-0 text-2xl font-bold text-center ${rankColor} group-hover:scale-110 transition-transform duration-200`}>
        {rank}.
      </div>
      <div className="flex-1">
        <a className="text-blue-600 font-medium text-sm cursor-pointer hover:underline group-hover:text-pink-500 transition-colors duration-200">{title}</a>
        <div className="text-xs text-gray-400 mt-0.5">{t('jobInterestedCount', language).replace('{count}', positions.toString())}</div>
      </div>
      <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden ml-2 border border-gray-200 bg-gray-50 flex items-center justify-center shadow group-hover:shadow-md transition-all duration-200">
        {imageUrl ? (
          <img src={API_URL_MEDIA + imageUrl} alt={title} className="w-12 h-12 object-cover" />
        ) : (
          <span className="text-2xl text-gray-300">🏢</span>
        )}
      </div>
    </div>
  );
};

// Visitor Summary Chart (Bar chart with Application/Website)
import VisitorSummaryChart from './VisitorSummaryChart';

const DashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const userStr = localStorage.getItem('jobyamUserAdmin');
        if (!userStr) throw new Error('ไม่พบข้อมูลผู้ใช้ (jobyamUserAdmin)');
        const user = JSON.parse(userStr);
        const role = user?.role?.name;
        let user_id = user?.id;

        if (!role) throw new Error('ไม่พบข้อมูล role');

        if (role === 'owner') {
          if (!user.companyID) throw new Error('ไม่พบ companyID');
          user_id = user.companyID;
        } else if (role === 'manpower') {
          if (!user.manpowerID) throw new Error('ไม่พบ manpowerID');
          user_id = user.manpowerID;
        }

        if (!user_id) throw new Error('ไม่พบข้อมูล user_id');

        const dashboardData = await fetchDashboard(role, user_id);
        setData(dashboardData.data);
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingOverlay isLoading={loading} />;
  }
  if (error) {
    return <div className="w-full flex justify-center items-center min-h-[300px] text-red-500">{error}</div>;
  }
  if (!data) return null;

  return (
    <div className="min-h-screen relative">
      <div className="w-full">
        <style>{`
          @keyframes dashboard-fade-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.98); }
          60% { opacity: 1; transform: translateY(-8px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dashboard-animate { animation: dashboard-fade-in 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .dashboard-animate-delay-1 { animation-delay: 0.15s; }
        .dashboard-animate-delay-2 { animation-delay: 0.3s; }
        .dashboard-animate-delay-3 { animation-delay: 0.45s; }
      `}</style>
        <h1 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-pink-500 to-sky-400 drop-shadow">{t('dashboard', language)}</h1>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div
            className="dashboard-animate dashboard-animate-delay-1 cursor-pointer block"
            onClick={() => navigate('/applicantlist')}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/applicantlist'); }}
          >
            <SummaryCard title={t('totalApplicants', language)} count={data.Applicants} icon="👥" />
          </div>
          <div
            className="dashboard-animate dashboard-animate-delay-2 cursor-pointer block"
            onClick={() => navigate('/jobsActivity/all')}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/jobsActivity'); }}
          >
            <SummaryCard title={t('totalActivity', language)} count={data.activity} icon="📅" />
          </div>
          <div
            className="dashboard-animate dashboard-animate-delay-3 cursor-pointer block"
            onClick={() => navigate('/jobsActivity/delayed')}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/jobsActivity/delayed'); }}
          >
            <SummaryCard title={t('delayedActivity', language)} count={data.activityDelayed} icon="⏰" />
          </div>
          <div
            className="dashboard-animate dashboard-animate-delay-4 cursor-pointer block"
            onClick={() => navigate('/jobsActivity/success')}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/jobsActivity'); }}
          >
            <SummaryCard title={t('successActivity', language)} count={data.activitySuccess} icon="✅" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Visitor Summary Chart (Recharts, bigger) */}
          <div className="lg:col-span-3 dashboard-animate dashboard-animate-delay-2">
            {data.visitorsSummary && data.visitorsSummary.length > 0 && (
              <VisitorSummaryChart data={[...data.visitorsSummary.slice(-30)].reverse()} />
            )}
          </div>
          {/* Top 10 Jobs Section (smaller, glassmorphism) */}
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 lg:col-span-1 dashboard-animate dashboard-animate-delay-3">
            <div className="p-3 border-b border-white/20">
              <h3 className="font-semibold text-base text-blue-700 drop-shadow">{t('topJobs', language)}</h3>
            </div>
            <div className="p-2">
              {data.jobTopTen && data.jobTopTen.length > 0 ? (
                data.jobTopTen.map((job, index) => (
                  <PopularJobCard
                    key={job.title + index}
                    rank={index + 1}
                    title={job.title}
                    interested={job.Interested}
                    imageUrl={job.title_media}
                    positions={1}
                  />
                ))
              ) : (
                <div className="p-2 text-gray-400 text-center text-sm">{t('noData', language)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <div className="bg-gradient-to-tr from-blue-50 via-pink-50 to-sky-100 p-0 min-h-screen">
      <DashboardContent />
    </div>
  );
};

export default Dashboard;
