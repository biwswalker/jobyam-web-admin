import { useState, useEffect } from 'react';
import { useDebounce } from '../utils';

export const useSearch = (initialValue = '', debounceTime = 500) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceTime);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Set isTyping to true when searchTerm changes
    if (searchTerm !== '') {
      setIsTyping(true);
    }
    
    // Set a timeout to set isTyping to false after debounce time
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceTime]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    clearSearch,
    isTyping,
  };
};
