'use client';

import { useState, useMemo } from 'react';

interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

interface UseDataTableOptions<T> {
  data: T[];
  pageSize?: number;
}

export function useDataTable<T = any>(options: UseDataTableOptions<T>) {
  const { data, pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return sortedData;
    const query = searchQuery.toLowerCase();
    return sortedData.filter((item) =>
      Object.values(item as Record<string, any>).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [sortedData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    data: paginatedData,
    sortedData: filteredData,
    currentPage,
    totalPages,
    pageSize,
    totalItems: filteredData.length,
    sortConfig,
    searchQuery,
    setSearchQuery,
    handleSort,
    goToPage,
    nextPage,
    prevPage,
  };
}

export default useDataTable;
