import { useState, useEffect } from 'react';
import type { User } from './types';
import api, { type ApiResponse } from '~/services/api';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: Error | null;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('users/select');

        if (!isMounted) {
          console.log('Component unmounted, not updating state');
          return;
        }

        let role = '';
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          const user = JSON.parse(localStorage.getItem('jobyamUserAdmin') || '{}');
          role = user?.role?.name || '';
        }

        const responseData = response as unknown as ApiResponse<User[]>;
        if (!responseData.data || !Array.isArray(responseData.data)) {
          throw new Error('Invalid response data format');
        }
        const usersData = role.toLowerCase() === 'supperadmin' 
          ? responseData.data 
          : responseData.data.filter((user) => user.role.toLowerCase() !== 'supperadmin');

        setUsers(usersData);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch users'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      console.log('Cleaning up useUsers effect');
      isMounted = false;
    };
  }, []);

  return { users, loading, error };
};
