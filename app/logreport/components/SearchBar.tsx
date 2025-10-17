interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  language: string;
}

export function SearchBar({ searchTerm, onSearchChange, language }: SearchBarProps) {
  return (
    <div className="flex-1">
      <input
        type="text"
        placeholder={
          language === 'en' 
            ? 'Search by username, action...' 
            : 'ค้นหาด้วยชื่อผู้ใช้, การดำเนินการ...'
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
