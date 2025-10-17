import React, { useMemo, useId } from 'react';
import Select from 'react-select';
import type { StatusOption } from '../config/statusOptions';
import type { Language } from '../types';

type FilterSelectProps<T extends string> = {
  value: T | 'All';
  onChange: (value: T | 'All') => void;
  options: StatusOption[];
  allLabel: string;
  language: Language;
  className?: string;
  placeholder?: string;
};

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  allLabel,
  language,
  className = '',
  placeholder = 'Select...',
}: FilterSelectProps<T>) {
  // Transform options for react-select
  const selectOptions = useMemo(() => {
    const allOption: StatusOption = {
      value: 'All',
      label: {
        en: allLabel,
        th: allLabel
      }
    };

    return [allOption, ...options];
  }, [options, allLabel]);

  // Find the current value in options
  const selectedOption = selectOptions.find(option => option.value === value) || null;

  // Handle change
  const handleChange = (selectedOption: StatusOption | null) => {
    onChange(selectedOption?.value as T | 'All' ?? 'All');
  };

  // Format the label based on the current language
  const formatOptionLabel = (option: StatusOption) => {
    return language === 'en' ? option.label.en : option.label.th;
  };

  // Filter function for search
  const filterOption = (option: { data: StatusOption }, inputValue: string) => {
    const input = inputValue.toLowerCase();
    const optionData = option.data;
    
    return (
      optionData.label.en.toLowerCase().includes(input) ||
      optionData.label.th.includes(input) ||
      optionData.value.toString().toLowerCase().includes(input)
    );
  };

  // Custom styles
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '44px',
      borderColor: '#d1d5db', // gray-300
      '&:hover': {
        borderColor: '#9ca3af', // gray-400
      },
      boxShadow: 'none',
      '&:focus-within': {
        borderColor: '#3b82f6', // blue-500
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.25)', // focus ring
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      '&:active': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#1f2937', // text-gray-800
    }),
  };

  const instanceId = useId();

  return (
    <div className={`w-full md:w-64 ${className}`}>
      <Select<StatusOption>
        instanceId={instanceId}
        inputId={`${instanceId}-input`}
        aria-live="polite"
        value={selectedOption}
        onChange={handleChange}
        options={selectOptions}
        filterOption={filterOption}
        formatOptionLabel={formatOptionLabel}
        isSearchable={true}
        placeholder={placeholder}
        className="react-select-container"
        classNamePrefix="react-select"
        styles={customStyles}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? 'ไม่พบข้อมูล' : 'ไม่มีตัวเลือก'
        }
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => 
          language === 'en' ? option.label.en : option.label.th
        }
      />
    </div>
  );
}
