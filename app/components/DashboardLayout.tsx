import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useLanguage1 } from '../context/LanguageContext';

// Create a language context
export type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'th',
  setLanguage: () => { }
});

export const useLanguage = () => useContext(LanguageContext);

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

interface User {
  name?: string;
  avatar?: string;
  role?: { name?: string };
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const { language1, setLanguage1 } = useLanguage1();

  const [user, setUser] = useState<User | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    if (typeof window !== 'undefined') {
      const userDataString = localStorage.getItem('jobyamUserAdmin');
      if (userDataString) {
        try {
          setUser(JSON.parse(userDataString));
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

  const handleEditProfile = () => {
    // Redirect to profile edit page or open modal (implement as needed)
    navigate('/profile');
  };

  // Initialize language from localStorage, but only in browser environment
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('jobyamLanguage');
      if (savedLanguage === 'en') {
        setLanguage('en');
      }
    }
  }, []);
  const navigate = useNavigate();

  // Check if user is authenticated
  React.useEffect(() => {
    // Only check authentication in browser environment
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('jobyamUserAdmin');
      if (!userData) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jobyamUserAdmin');
    }
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'th' ? 'en' : 'th';
    setLanguage(newLanguage);
    const newLanguage1 = language1 === 'th' ? 'en' : 'th';
    setLanguage1(newLanguage1);
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobyamLanguage', newLanguage);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar - only visible on mobile when menu is toggled */}
        <div className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Permanent sidebar - only visible on desktop */}
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => { }} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm z-10">
            <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
              <div className="flex items-center">
                <button
                  className="p-2 rounded-md lg:hidden text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <span className="text-xl">☰</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Language switcher */}
                <div className="flex items-center cursor-pointer">
                  <button
                    onClick={toggleLanguage}
                    className="px-2 sm:px-3 cursor-pointer py-1 text-sm font-medium text-blue-500 hover:text-blue-600 active:text-blue-700 rounded transition-colors"
                  >
                    {language === 'th' ? 'TH | EN' : 'EN | TH'}
                  </button>
                </div>

                {/* User profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="flex items-center cursor-pointer space-x-2 focus:outline-none transition-transform duration-150 hover:scale-105 active:scale-95"
                    tabIndex={0}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                  >
                    {/* Avatar with animated gradient ring */}
                    <span className="relative inline-block">
                      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 via-cyan-400 to-blue-400 animate-spin-slow blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 0 }} />
                      {user?.avatar ? (
                        <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md relative z-10" />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-lg border-2 border-white shadow-md relative z-10">
                          {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                  {/* Animated Dropdown */}
                  <div 
                    className={`absolute right-0 mt-3 w-72 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 transition-all duration-200 origin-top-right transform ${
                      isDropdownOpen 
                        ? 'scale-100 opacity-100 pointer-events-auto' 
                        : 'scale-95 opacity-0 pointer-events-none'
                    } ${isMobile ? 'shadow-lg' : ''}`}
                  >
                    {/* Profile Info */}
                    <div className="flex items-center px-5 pt-6 pb-3 space-x-4 border-b">
                      <span className="relative inline-block">
                        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 via-cyan-400 to-blue-400 animate-spin-slow blur-sm opacity-70" style={{ zIndex: 0 }} />
                        {user?.avatar ? (
                          <img src={user.avatar} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow relative z-10" />
                        ) : (
                          <span className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-2xl border-2 border-white shadow relative z-10">
                            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
                            )}
                          </span>
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-900 text-lg truncate drop-shadow-sm">{user?.name || '-'}</span>
                        <span className="text-sm text-cyan-600 font-semibold">{user?.role?.name || '-'}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col divide-y">
                      <button
                        className="flex items-center cursor-pointer px-5 py-3 text-cyan-700 hover:bg-cyan-50 active:bg-cyan-100 transition-all text-base space-x-3 font-semibold group"
                        onClick={handleEditProfile}
                      >
                        <svg className="w-5 h-5 text-cyan-500 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" /></svg>
                        <span>{language === 'th' ? 'แก้ไขข้อมูล' : 'Edit Profile'}</span>
                      </button>
                      <button
                        className="flex items-center cursor-pointer px-5 py-3 text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all text-base space-x-3 font-semibold group"
                        onClick={handleLogout}
                      >
                        <svg className="w-5 h-5 text-rose-500 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                        <span>{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </LanguageContext.Provider>
  );
};

export default DashboardLayout;
