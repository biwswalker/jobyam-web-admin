import React, { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { FaEye } from '@react-icons/all-files/fa/FaEye';
import { FaEdit } from '@react-icons/all-files/fa/FaEdit';
import { getAboutArticles, type AboutArticle } from '../../services/aboutArticleService';
import { useLanguage } from '../../components/DashboardLayout';
import { t } from '../../locales';
import { useNavigate } from 'react-router-dom';

const AboutArticlePage: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<AboutArticle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAboutArticles()
      .then(data => {
        setData(data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const typeMap: Record<number, string> = {
    1: t('article', language),
    2: t('about', language),
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const title = language === 'th' ? item.TitleTH : item.TitleEN;
      return title.toLowerCase().includes(search.toLowerCase());
    });
  }, [data, search, language]);

  // Map data to match columns' keys for sorting
  const displayData = filteredData.map(item => {
    const dateObj = new Date(item.Date);
    return {
      ...item,
      title: language === 'th' ? item.TitleTH : item.TitleEN,
      type: typeMap[item.TypeId] || '-',
      date: dateObj.toLocaleDateString(language),
      dateValue: dateObj.getTime(), // สำหรับ sort
    };
  });

  const columns = [
    {
      key: 'title',
      title: t('title', language),
      render: (item: any) => item.title,
      sortable: true,
    },
    {
      key: 'type',
      title: t('type', language),
      render: (item: any) => item.type,
      sortable: true,
    },
    {
      key: 'dateValue', // sort ด้วย timestamp
      title: t('date', language),
      render: (item: any) => item.date,
      sortable: true,
    },
    {
      key: 'actions',
      title: t('actions', language),
      render: (item: AboutArticle) => (
        <div className="flex gap-2">
          {/* <button
            className="text-blue-600 cursor-pointer hover:text-blue-800"
            onClick={() => handleEdit(item)}
            title="View"
          >
            <FaEye />
          </button> */}
          <button
            className="text-green-600 cursor-pointer hover:text-green-800 transform transition-all duration-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-teal-300 p-2 md:p-2.5 rounded-full text-sm md:text-base"
            onClick={() => handleEdit(item)}
            title="Edit"
          >
            <FaEdit size={18} />
          </button>
        </div>
      ),
    },
  ];

  const navigate = useNavigate();
  function handleEdit(record: AboutArticle) {
    navigate(`/settings/aboutarticle/${record.ID}`);
  }

  return (
    <div className="backdrop-blur-xl bg-white/100 rounded-none sm:rounded-2xl shadow-2xl border border-white/40 w-full h-full flex flex-col transition-all duration-300 overflow-hidden">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-teal-700 flex items-center gap-2 px-4 md:px-6 pt-4 md:pt-6">
        {t('about_article', language)}
      </h1>
      <div className="mb-4 md:mb-6 flex items-center px-4 md:px-6">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-search"><circle cx="8" cy="8" r="7" /><line x1="14" y1="14" x2="11" y2="11" /></svg>
          </span>
          <input
            className="pl-10 pr-4 py-2 md:py-2.5 w-full rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all duration-200 bg-white/80 hover:bg-white text-sm md:text-base"
            placeholder={t('search', language)}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <DataTable
        data={displayData}
        columns={columns}
        keyExtractor={item => item.ID.toString()}
        className="bg-white/90 rounded-none sm:rounded-xl shadow-lg border border-gray-100 transition-all duration-300 w-full overflow-x-auto md:overflow-x-hidden"
        pagination={{ pageSize: 20, currentPage: 1, onPageChange: () => { }, totalItems: 0 }}
      />
    </div>
  );
};

export default AboutArticlePage;
