import { useState, useEffect } from 'react';

interface UserInfo {
  id?: string;
  username?: string;
  userName?: string;
  name?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  status?: boolean;
  address?: string;
  birthDay?: string;
  role_id?: string;
  roleId?: string;
  role?: {
    id: string;
    name: string;
  };
  contactName?: string;
  contactNumber?: string;
  relationship?: string;
  [key: string]: any;
}

const USER_STORAGE_KEY = 'jobyamUserAdmin';

const useUserInfo = (): { userInfo: UserInfo | null; isLoading: boolean } => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const userStr = localStorage.getItem(USER_STORAGE_KEY);
        
        if (!userStr) {
          console.warn('No user data found in localStorage');
          setIsLoading(false);
          return;
        }


        const user = JSON.parse(userStr);
        if (user) {
          // Ensure we have the expected user properties
          const formattedUser: UserInfo = {
            id: user.id || user._id,
            username: user.username || user.userName,
            userName: user.userName || user.username,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            ...user
          };
          setUserInfo(formattedUser);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_STORAGE_KEY) {
        loadUserInfo();
      }
    };

    // Load user info on mount
    loadUserInfo();

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { userInfo, isLoading };
};

export const setUserInfo = (userData: UserInfo | null): void => {
  try {
    if (typeof window !== 'undefined') {
      if (userData) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      // Dispatch storage event to update all hooks
      window.dispatchEvent(new Event('storage'));
    }
  } catch (error) {
    console.error('Error saving user info:', error);
  }
};

export default useUserInfo;
