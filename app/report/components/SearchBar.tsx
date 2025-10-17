import React from 'react';
import { X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onReset: () => void;
  language: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onReset,
  language,
}) => {
  return (
    <div className="relative w-full transition-all duration-200">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder={language === 'en' ? 'Search...' : 'ค้นหา...'}
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 sm:text-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={language === 'en' ? 'Search' : 'ค้นหา'}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onReset();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label={language === 'en' ? 'Clear search' : 'ล้างการค้นหา'}
          >
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};

interface SearchFilterProps {
  searchTerm: string;
  onClear: () => void;
  language: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onClear,
  language,
}) => {
  if (!searchTerm) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        {language === 'en' ? 'Search' : 'ค้นหา'}: {searchTerm}
        <button
          onClick={onClear}
          className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
        >
          <X size={12} />
        </button>
      </span>
    </div>
  );
};
