import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Notification } from "~/model/Notification";
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useLanguage } from './DashboardLayout';

// Add the import for environment variables
const VITE_API_URL_WS = import.meta.env.VITE_API_URL_WS;

// Menu item type definition
interface SidebarMenuItem {
  key: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  roles: string[];
  /**
   * เมนูย่อย (optional) รองรับการมี sub menu
   */
  subItems?: SidebarMenuItem[];
  name?: string;
  badge?: string | number;
}
// For legacy usage, you may also export type MenuItem = SidebarMenuItem;
type MenuItem = SidebarMenuItem; // Alias for backward compatibility

// Lucide-react icons
import { 
  BarChart as BarChartIcon,
  Bell as BellIcon,
  Briefcase as BriefcaseIcon,
  Database as DatabaseIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Settings as SettingsIcon,
  UserCog as UserCogIcon,
  Users as UsersIcon,
  UserPlus as UserPlusIcon,
  FileText as FileTextIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

// --- Utility: get role and permissions from localStorage ---
function getUserRoleAndPermissions() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    // Running on server or outside browser, return default/fallback
    return { userRole: '', userPermissions: [] };
  }
  const userDataString = localStorage.getItem('jobyamUserAdmin');
  let userRole = '';
  let userPermissions: string[] = [];
  if (userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      userRole = userData.role?.name || '';
      userPermissions = userData.permissions || [];
    } catch {
      // fallback
    }
  }
  return { userRole, userPermissions };
}

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  // --- เรียก getMenuItems ด้วย language และ applicantCount ---
  const { language } = useLanguage();
  const [applicantCount, setApplicantCount] = useState<number>(0);

  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();

  // Get user role and permissions from localStorage.jobyamUserAdmin
  // SSR-safe initial value; update with real data on client
  const [userInfo, setUserInfo] = useState<{ userRole: string; userPermissions: string[] }>({ userRole: '', userPermissions: [] });

  useEffect(() => {
    setUserInfo(getUserRoleAndPermissions());
  }, []);

  const { userRole, userPermissions } = userInfo;

  // --- Filter menu: supperAdmin เห็นทุกเมนู, อื่นๆ เห็นเฉพาะเมนูที่ตรงกับ role หรือ permission ---
  // Normalize userRole: lowercase and trim
  const normalizedRole = (userRole || '').trim().toLowerCase();

  // WebSocket setup
  // useEffect(() => {
  //   if (newNotification) {
  //     const timer = setTimeout(() => {
  //       setNewNotification(null);
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  //   try {
  //     // Parse the user data from localStorage
  //     const userDataString = localStorage.getItem('jobyamUserAdmin');
  //     if (!userDataString) {
  //       console.error('No user data found in localStorage');
  //       return;
  //     }

  //     const userData = JSON.parse(userDataString);
  //     // WebSocket connection URL
  //     const wsUrl = VITE_API_URL_WS + `ws?user_id=${userData.id}&userType=admin`;
  //     console.log('WebSocket URL:', wsUrl);
  //     const ws = new WebSocket(wsUrl);

  //     // WebSocket event handlers
  //     ws.onopen = () => {
  //       console.log('WebSocket connection established');
  //     };

  //     ws.onmessage = (event) => {
  //       console.log("WebSocket message:", event.data);
  //       try {
  //         const rawData = JSON.parse(event.data);
  //         if (rawData.type === "NEW_NOTIFICATION") {
  //           setNewNotification(rawData.data);
  //         } else if (rawData.type === "ALL_NOTI_ADMIN") {
  //           setNewNotification(rawData.data);
  //         }
  //         // สามารถเพิ่มกรณีอื่นๆ ได้ที่นี่ เช่น "PING", "UPDATE_COUNT" เป็นต้น
  //       } catch (err) {
  //         console.log("WebSocket message parse error:", err);
  //       }
  //     };

  //     ws.onerror = (error) => {
  //       console.error('WebSocket error:', error);
  //     };

  //     ws.onclose = () => {
  //       console.log('WebSocket connection closed');
  //     };

  //     // Clean up WebSocket connection when component unmounts
  //     return () => {
  //       ws.close();
  //     };
  //   } catch (error) {
  //     console.error('Error connecting to WebSocket:', error);
  //   }
  // }, [newNotification]); // Re-connect if user ID changes

  // Get applicant count from session storage
  useEffect(() => {
    const getApplicantCount = () => {
      try {
        const cachedData = sessionStorage.getItem('applicants');
        if (cachedData) {
          const applicants = JSON.parse(cachedData);
          setApplicantCount(Array.isArray(applicants) ? applicants.length : 0);
        }
      } catch (error) {
        console.error('Error reading applicants from session storage:', error);
        setApplicantCount(0);
      }
    };

    // Initial count
    getApplicantCount();

    // Set up interval to check for changes every 5 seconds
    const interval = setInterval(getApplicantCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // Toggle submenu
  const toggleSubmenu = (path: string) => {
    setOpenSubmenu(openSubmenu === path ? null : path);
  };

  // Check if a menu item is active
  const isMenuItemActive = (item: SidebarMenuItem) => {
    // If this item has subItems, check if any subItem is active
    if (item.subItems && item.subItems.length > 0) {
      return item.subItems.some((sub: SidebarMenuItem) => location.pathname === sub.path);
    }
    // Otherwise, check if the main menu is active
    return location.pathname === item.path;
  };

  const isSubMenuItemActive = (subPath: string) => location.pathname === subPath;

  // Menu items configuration with language support
  const getMenuItems = (): SidebarMenuItem[] => {
    if ((userRole || '').trim().toLowerCase() === 'agent') {
      return [
        {
          key: 'applicants',
          label: language === 'en' ? 'Applicants' : 'รายการผู้สมัคร',
          icon: <UsersIcon className="w-5 h-5" />,
          path: '/applicants',
          // badge: applicantCount > 0 ? applicantCount.toString() : undefined,
          roles: ['agent']
        }
      ];
    }
    return [
      {
        key: 'dashboard',
        label: language === 'en' ? 'Dashboard' : 'แดชบอร์ด',
        icon: <LayoutDashboardIcon className="w-5 h-5" />,
        path: '/dashboard',
        roles: ['supperAdmin', 'admin', 'modulator', 'owner', 'staff', 'manpower']
      },
      {
        key: 'notifications',
        label: language === 'en' ? 'Notifications' : 'แจ้งเตือน',
        icon: <BellIcon className="w-5 h-5" />,
        path: '/notifications',
        // badge: '99+',
        roles: ['supperAdmin', 'admin', 'modulator', 'owner', 'staff', 'manpower']
      },
      {
        key: 'applicants',
        label: language === 'en' ? 'Applicants' : 'รายการผู้สมัคร',
        icon: <UsersIcon className="w-5 h-5" />,
        path: '/applicants',
        // badge: applicantCount > 0 ? applicantCount.toString() : undefined,
        roles: ['supperAdmin', 'admin', 'modulator', 'owner', 'staff', 'manpower']
      },
      {
        key: 'jobs',
        label: language === 'en' ? 'Job Postings' : 'ประกาศสมัครงาน',
        icon: <BriefcaseIcon className="w-5 h-5" />,
        path: '/jobs',
        roles: ['supperAdmin', 'admin', 'modulator', 'owner', 'staff', 'manpower']
      },
      {
        key: 'advisors',
        label: language === 'en' ? 'Job Referral List' : 'รายการผู้แนะนำ',
        icon: <UserPlusIcon className="w-5 h-5" />,
        path: '/advisors',
        roles: ['supperAdmin', 'admin', 'modulator', 'manpower']
      },
      {
        key: 'logreport',
        label: language === 'en' ? 'Log Report' : 'รายงานการทำงาน',
        icon: <BarChartIcon className="w-5 h-5" />,
        path: '/logreport',
        roles: ['supperAdmin']
      },
      {
        key: 'report',
        label: language === 'en' ? 'Reports' : 'รายงาน',
        icon: <FileTextIcon className="w-5 h-5" />,
        path: '/report',
        roles: ['supperAdmin', 'admin', 'manpower', 'owner'],
        subItems: [
          { key: 'interestedusers', label: language === 'en' ? 'Report Interested Users' : 'รายงานผู้สนใจ', path: 'report/interestedusers', roles: ['supperAdmin', 'admin', 'manpower'], icon: <DatabaseIcon className="w-4 h-4" /> },
          { key: 'jobapplicants', label: language === 'en' ? 'Report Job Applicants' : 'รายงานผู้สมัครงาน', path: 'report/jobapplicants', roles: ['supperAdmin', 'admin', 'manpower'], icon: <BriefcaseIcon className="w-4 h-4" /> },
          { key: 'reportreferralapplicants', label: language === 'en' ? 'Report Referral Applicants' : 'รายงานผู้แนะนำ', path: 'report/reportreferralapplicants', roles: ['supperAdmin', 'admin', 'manpower'], icon: <UsersIcon className="w-4 h-4" /> },
        ]
      },
      {
        key: 'master-data',
        label: language === 'en' ? 'Master Data' : 'ข้อมูลหลัก',
        icon: <DatabaseIcon className="w-5 h-5" />,
        path: '/master-data',
        roles: ['supperAdmin', 'admin', 'modulator'],
        subItems: [
          { key: 'companies', label: language === 'en' ? 'ManPower Demand' : 'ผุ้ว่าจ้าง', path: '/company', roles: ['supperAdmin', 'admin', 'modulator', 'owner'], icon: <DatabaseIcon className="w-4 h-4" /> },
          { key: 'job-types', label: language === 'en' ? 'Job Types' : 'ประเภทงาน', path: '/jobs/types', roles: ['supperAdmin', 'admin', 'modulator', 'owner'], icon: <BriefcaseIcon className="w-4 h-4" /> },
          { key: 'job-manpower', label: language === 'en' ? 'ManPower Supply' : 'ผู้จัดหา', path: '/jobmanpower', roles: ['supperAdmin', 'admin', 'modulator', 'owner'], icon: <UsersIcon className="w-4 h-4" /> },
          { key: 'templateplans', label: language === 'en' ? 'Template Plans' : 'เทมเพลต แผน', path: '/templateplans', roles: ['supperAdmin'], icon: <UsersIcon className="w-4 h-4" /> },
          { key: 'preparedocuments', label: language === 'en' ? 'Prepare Documents' : 'เตรียมเอกสาร', path: '/preparedocuments', roles: ['supperAdmin'], icon: <UsersIcon className="w-4 h-4" /> }
        ]
      },
      {
        key: 'settings',
        label: language === 'en' ? 'Settings' : 'ตั้งค่า',
        icon: <SettingsIcon className="w-5 h-5" />,
        path: '/settings',
        roles: ['supperAdmin', 'admin', 'modulator'],
        subItems: [
          { key: 'roles', label: language === 'en' ? 'Roles' : 'บทบาท', path: '/role', roles: ['supperAdmin'], icon: <UserCogIcon className="w-4 h-4" /> },
          { key: 'manageadmin', label: language === 'en' ? 'Manage Admin' : 'จัดการผู้ดูแลระบบ', path: '/manageadmin', roles: ['supperAdmin', 'admin', 'modulator'], icon: <UsersIcon className="w-4 h-4" /> },
          { key: 'manageusers', label: language === 'en' ? 'Manage Users' : 'จัดการผู้ใช้', path: '/manageusers', roles: ['supperAdmin', 'admin', 'modulator'], icon: <UsersIcon className="w-4 h-4" /> },
          { key: 'aboutarticle', label: language === 'en' ? 'About Article' : 'บทความเกี่ยวกับเรา', path: '/settings/aboutarticle', roles: ['supperAdmin', 'admin', 'modulator'], icon: <UsersIcon className="w-4 h-4" /> }
        ]
      }
    ];
  }

  const restrictedKeysByRole = {
    staff: ['master-data', 'settings', 'admin-settings'],
    owner: ['settings', 'admin-settings'],
    manpower: ['settings', 'admin-settings'],
  };
  const rolesWithRestrictions = Object.keys(restrictedKeysByRole);
  const normalizedRoleLower = normalizedRole.toLowerCase();

  function getRestrictedKeys(role: string): string[] {
    return restrictedKeysByRole[role as keyof typeof restrictedKeysByRole] || [];
  }

  // First filter the main menu items
  const filteredMenuItems = getMenuItems().filter(menu => {
    if (normalizedRoleLower === "supperadmin") return true;
    
    if (rolesWithRestrictions.includes(normalizedRoleLower)) {
      const keys = getRestrictedKeys(normalizedRoleLower);
      if (keys.includes(menu.key)) {
        return false;
      }
      return menu.roles.map(r => r.toLowerCase()).includes(normalizedRoleLower);
    }

    return menu.roles.map(r => r.toLowerCase()).includes(normalizedRoleLower);
  });

  // Then process submenu items
  const menuItems = filteredMenuItems.reduce<SidebarMenuItem[]>((acc, menu) => {
    if (menu.subItems) {
      const filteredSubItems = menu.subItems.filter(subItem => {
        // If user is not supperadmin, check if they have the required role for this submenu item
        if (normalizedRoleLower !== 'supperadmin') {
          return subItem.roles.some(role => 
            role.toLowerCase() === normalizedRoleLower
          );
        }
        return true; // supperadmin can see all submenu items
      });
      
      // Only include the menu if it has subitems after filtering
      if (filteredSubItems.length > 0) {
        acc.push({
          ...menu,
          subItems: filteredSubItems
        });
      }
    } else {
      // Menu items without subitems can be included directly
      acc.push(menu);
    }
    return acc;
  }, []);

  const handleLogoClick = () => {
    if (isMobile) {
      onClose();
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Mobile overlay with blur effect */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar - always visible on desktop, toggleable on mobile */}
      <div
        className={`bg-[var(--color-primary,#0038A8)] text-white w-[85vw] max-w-[300px] sm:w-64 fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-16 border-b border-[color:var(--color-primary,rgba(0, 0, 0, 0.8))] bg-[var(--color-primary,#0038A8)]/100">
          <img
            src="/Logo2Colour.png"
            alt="JobYam Logo"
            onClick={() => handleLogoClick()}
            className="h-16 w-auto cursor-pointer bg-white transition-transform duration-300"
            // style={{ filter: 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.8))' }}
          />
          <span className="text-lg p-4 sm:text-xl font-bold text-white">JOBYAM: {userRole?.toUpperCase()}</span>
          <button
            className="p-2 rounded-md lg:hidden text-white hover:bg-[#235bcf] active:bg-[#002060] transition-colors touch-manipulation"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <nav className="mt-3 sm:mt-5 px-2 h-[calc(100vh-4rem)] overflow-y-auto pb-20">
          <ul className="space-y-2 sm:space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => {
                        toggleSubmenu(item.path);
                        // Don't close sidebar when toggling submenu
                      }}
                      className={`w-full cursor-pointer flex items-center justify-between px-3 py-3 sm:py-2 text-sm font-medium rounded-md transition-colors ${isMenuItemActive(item)
                        ? 'bg-[#235bcf] text-white'
                        : 'text-white hover:bg-[#235bcf] active:bg-[#002060]'
                        }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="ml-auto mr-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {openSubmenu === item.path ? (
                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 ml-2" />
                      )}
                    </button>
                    {openSubmenu === item.path && (
                      <ul className="mt-1 pl-8 sm:pl-10 space-y-2 sm:space-y-1">
                        {item.subItems.map((subItem: SidebarMenuItem, subIndex: number) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.path}
                              onClick={() => { if (isMobile) onClose(); }}
                              className={`block px-3 py-3 sm:py-2 text-sm rounded-md transition-colors ${isSubMenuItemActive(subItem.path)
                                ? 'bg-[#235bcf] text-white font-medium'
                                : 'text-[#c7e0fa] hover:bg-[#235bcf]'
                                }`}
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => { if (isMobile) onClose(); }}
                    className={`flex items-center justify-between px-3 py-3 sm:py-2 text-sm font-medium rounded-md transition-colors ${isMenuItemActive(item)
                      ? 'bg-[#235bcf] text-white'
                      : 'text-[#c7e0fa] hover:bg-[#235bcf]'
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {newNotification && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-[#40c7c9] to-[#61cfc2] p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden"
            >
              {/* Animated circles in background */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -left-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full"
              />

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="text-center"
                >
                  <motion.h3
                    className="text-2xl font-bold text-white mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 1,
                    }}
                  >
                    {newNotification.title}
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 mb-6"
                  >
                    {newNotification.message}
                  </motion.p>

                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => setNewNotification(null)}
                    className="px-6 py-3 bg-white text-[#40c7c9] rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:scale-105 font-bold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {language === 'en' ? 'Close' : 'ปิด'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default Sidebar;
