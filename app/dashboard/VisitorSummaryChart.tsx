import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../components/DashboardLayout';
import { t } from '../locales';
import type { VisitorSummaryItem } from './index';

const VisitorSummaryChart: React.FC<{ data: VisitorSummaryItem[] }> = ({ data }) => {
  const { language } = useLanguage();
  return (
    <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-lg shadow-xl border border-white/20 hover:scale-[1.02] transition-all duration-300 animate-fadein">
      <h3 className="font-medium mb-2">{t('visitorSummary', language)}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          barCategoryGap="15%"
          barGap={0}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={date => new Date(date).getDate().toString().padStart(2, '0')}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="application_count" name={language === 'th' ? 'แอพลิเคชัน' : 'Application'} fill="#ff3385" />
          <Bar dataKey="website_count" name={language === 'th' ? 'เว็บไซต์' : 'Website'} fill="#5c5cd6" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center mt-4 gap-6">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full shadow-md border-2 border-white" style={{ background: '#ff3385' }}></span>
          <span className="text-xs font-medium text-gray-700 drop-shadow">{language === 'th' ? 'แอพลิเคชัน' : 'Application'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full shadow-md border-2 border-white" style={{ background: '#5c5cd6' }}></span>
          <span className="text-xs font-medium text-gray-700 drop-shadow">{language === 'th' ? 'เว็บไซต์' : 'Website'}</span>
        </div>
      </div>
    </div>
  );
};

export default VisitorSummaryChart;
