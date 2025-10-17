import { X } from 'lucide-react';

type Language = 'en' | 'th';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (dates: { startDate: string; endDate: string }) => void;
  onClear: () => void;
  language: Language;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  onClear,
  language,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-2 w-full md:w-auto">
      <div className="relative flex-1">
        <input
          type="date"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={startDate || ''}
          onChange={(e) => {
            const newStartDate = e.target.value;
            onDateChange({
              startDate: newStartDate,
              endDate: endDate && newStartDate > endDate ? newStartDate : endDate,
            });
          }}
          max={endDate || new Date().toISOString().split('T')[0]}
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
        </span>
      </div>
      <span className="text-gray-400">-</span>
      <div className="relative flex-1">
        <input
          type="date"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={endDate || ''}
          onChange={(e) => {
            const newEndDate = e.target.value;
            onDateChange({
              endDate: newEndDate,
              startDate: startDate && newEndDate < startDate ? newEndDate : startDate,
            });
          }}
          min={startDate}
          max={new Date().toISOString().split('T')[0]}
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
        </span>
        {(startDate || endDate) && (
          <button
            onClick={onClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title={language === 'en' ? 'Clear dates' : 'ล้างวันที่'}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
