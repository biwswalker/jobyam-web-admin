import React, { useState, useEffect } from 'react';
import { useLanguage } from '../components/DashboardLayout';
import { useLanguage1 } from '../context/LanguageContext';

// Mock data for translations
const translationsData = [
  {
    id: 1,
    group: 'common',
    english: 'Dashboard',
    thai: 'แดชบอร์ด'
  },
  {
    id: 2,
    group: 'common',
    english: 'Notifications',
    thai: 'การแจ้งเตือน'
  },
  {
    id: 3,
    group: 'common',
    english: 'Applicants',
    thai: 'รายการผู้สมัคร'
  },
  {
    id: 4,
    group: 'common',
    english: 'Job Postings',
    thai: 'ประกาศสมัครงาน'
  },
  {
    id: 5,
    group: 'common',
    english: 'Master Data',
    thai: 'ข้อมูลหลัก'
  },
  {
    id: 6,
    group: 'common',
    english: 'Settings',
    thai: 'ตั้งค่า'
  },
  {
    id: 7,
    group: 'jobs',
    english: 'Job Board',
    thai: 'กระดานงาน'
  },
  {
    id: 8,
    group: 'jobs',
    english: 'Create Job',
    thai: 'สร้างงาน'
  },
  {
    id: 9,
    group: 'jobs',
    english: 'Job History',
    thai: 'ประวัติงาน'
  },
  {
    id: 10,
    group: 'settings',
    english: 'Language',
    thai: 'แปลภาษา'
  },
  {
    id: 11,
    group: 'settings',
    english: 'ManPower Demand',
    thai: 'ผู้ว่าจ้าง'
  },
  {
    id: 12,
    group: 'settings',
    english: 'Admin Accounts',
    thai: 'บัญชีผู้ดูแลระบบ'
  },
  {
    id: 13,
    group: 'auth',
    english: 'Login',
    thai: 'เข้าสู่ระบบ'
  },
  {
    id: 14,
    group: 'auth',
    english: 'Register',
    thai: 'ลงทะเบียน'
  },
  {
    id: 15,
    group: 'auth',
    english: 'Forgot Password',
    thai: 'ลืมรหัสผ่าน'
  }
];

// Generate more mock data
for (let i = 16; i <= 50; i++) {
  const groups = ['common', 'jobs', 'settings', 'auth', 'dashboard', 'notifications'];
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];

  translationsData.push({
    id: i,
    group: randomGroup,
    english: `English Text ${i}`,
    thai: `ข้อความภาษาไทย ${i}`
  });
}

const LanguageSettings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const { language, setLanguage } = useLanguage();
  const { language1, setLanguage1 } = useLanguage1();

  const itemsPerPage = 10;

  // Filter translations based on search term
  const filteredTranslations = translationsData.filter(translation => {
    const searchLower = searchTerm.toLowerCase();
    return (
      translation.group.toLowerCase().includes(searchLower) ||
      translation.english.toLowerCase().includes(searchLower) ||
      translation.thai.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredTranslations.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTranslations.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Start editing a translation
  const handleEdit = (id: number, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  // Save edited translation
  const handleSave = (id: number) => {
    setEditingId(null);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{language === 'en' ? 'Settings > Language' : 'ตั้งค่า > แปลภาษา'}</h1>

        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 text-sm border rounded-md"
            onClick={() => {
              const newLanguage = language === 'th' ? 'en' : 'th';
              const newLanguage1 = language1 === 'th' ? 'en' : 'th';
              setLanguage(newLanguage);
              setLanguage1(newLanguage1)
              // Only access localStorage in browser environment
              if (typeof window !== 'undefined') {
                localStorage.setItem('jobyamLanguage', newLanguage);
              }
            }}
          >
            {language === 'th' ? 'TH | EN' : 'EN | TH'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
          {language === 'en' ? 'Add New Language' : 'เพิ่มภาษาใหม่'}
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
          {language === 'en' ? 'Import Translations' : 'นำเข้าการแปลภาษา'}
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
          {language === 'en' ? 'View All Languages' : 'ดูภาษาทั้งหมด'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={language === 'en' ? 'Search...' : 'ค้นหา...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500">🔍</span>
          </div>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Group' : 'กลุ่ม'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'English' : 'ภาษาอังกฤษ'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Thai' : 'ภาษาไทย'}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Actions' : 'จัดการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((translation) => (
                <tr key={translation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {translation.group}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {translation.english}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === translation.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      translation.thai
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === translation.id ? (
                      <>
                        <button
                          onClick={() => handleSave(translation.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          {language === 'en' ? 'Save' : 'บันทึก'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {language === 'en' ? 'Cancel' : 'ยกเลิก'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(translation.id, translation.thai)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {language === 'en' ? 'Edit' : 'แก้ไข'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              {language === 'en' ? 'Previous' : 'ก่อนหน้า'}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNumber;

              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={i}
                  onClick={() => paginate(pageNumber)}
                  className={`px-3 py-1 border border-gray-300 text-sm font-medium ${currentPage === pageNumber
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              {language === 'en' ? 'Next' : 'ถัดไป'}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default LanguageSettings;
