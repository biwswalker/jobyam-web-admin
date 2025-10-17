import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (initialPageSize = 10) => {
  const [searchParams] = useSearchParams();
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Update URL when pagination changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', currentPage.toString());
    params.set('limit', pageSize.toString());
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }, [currentPage, pageSize, searchParams]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    pageSize,
    currentPage,
    setPageSize: handlePageSizeChange,
    setCurrentPage: handlePageChange,
    resetPagination,
  };
};
