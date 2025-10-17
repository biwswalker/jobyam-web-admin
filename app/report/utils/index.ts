import { useEffect, useRef, useState } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


export const formatDate = (dateString: string, locale: string = 'en-US'): string => {
  return new Date(dateString).toLocaleDateString(
    locale === 'en' ? 'en-US' : 'th-TH'
  );
};
