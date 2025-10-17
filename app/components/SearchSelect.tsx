import React, { useEffect, useState } from 'react';
import api from '~/services/api';

interface Option {
  id: string;
  name: string;
}

interface SearchSelectProps {
  apiPath: string;
  value?: string;
  onChange: (value: string, option?: Option) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const SearchSelect: React.FC<SearchSelectProps> = ({
  apiPath,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  disabled = false,
  style = {},
}) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(apiPath)
      .then((res) => {
        if (mounted && res.code === 200 && Array.isArray(res.data)) {
          setOptions(res.data);
        }
      })
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [apiPath]);

  return (
    <div className={[
      'mb-4 w-full min-w-0',
      'sm:mb-0 sm:min-w-[160px] sm:max-w-xs',
      style?.marginBottom ? '' : '',
    ].join(' ')} style={style}>
      {label && <label className="block mb-1 font-semibold text-sm text-gray-700">{label}</label>}
      <select
        value={value || ''}
        disabled={disabled || loading}
        onChange={e => {
          const selected = options.find(o => o.id === e.target.value);
          onChange(e.target.value, selected);
        }}
        className={[
          'shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full text-sm border-gray-300 rounded-lg py-3 bg-white transition duration-150 ease-in-out',
          (disabled || loading) ? 'opacity-60 cursor-not-allowed bg-gray-100' : '',
        ].join(' ')}
      >
        <option value="" disabled>{loading ? 'Loading...' : placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
};

export default SearchSelect;
