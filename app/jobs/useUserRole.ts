// Utility hook to get current user role from localStorage (SSR safe)
import { useEffect, useState } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userDataString = localStorage.getItem('jobyamUserAdmin');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          setRole(userData.role?.name || '');
        } catch {}
      }
    }
  }, []);

  return role;
}
