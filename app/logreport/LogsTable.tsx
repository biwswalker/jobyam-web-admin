import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { AdminLog } from './types';
import { formatDate } from './utils';

interface LogsTableProps {
  logs: AdminLog[];
  loading: boolean;
  language: string;
  currentPage?: number;
  pageSize?: number;
}

export const LogsTable = ({
  logs,
  loading,
  language,
  currentPage = 1,
  pageSize = 10
}: LogsTableProps) => {
  const columns = [
    {
      accessorKey: 'index',
      header: language === 'en' ? 'No.' : 'ลำดับ',
      cell: ({ row }: { row: { index: number } }) => {
        // Calculate the row number based on current page and page size
        const rowNumber = (currentPage - 1) * pageSize + row.index + 1;
        return <div>{rowNumber}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: language === 'en' ? 'Date/Time' : 'วันที่/เวลา',
      cell: ({ row }: { row: { original: AdminLog } }) => (
        <div>{formatDate(row.original.createdAt)}</div>
      ),
    },
    {
      accessorKey: 'userName',
      header: language === 'en' ? 'Username' : 'ชื่อผู้ใช้',
      cell: ({ row }: { row: { original: AdminLog } }) => (
        <div>{row.original.userName || '-'}</div>
      ),
    },
    {
      accessorKey: 'actionType',
      header: language === 'en' ? 'Action' : 'การกระทำ',
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP',
    },
    {
      accessorKey: 'status',
      header: language === 'en' ? 'Status' : 'สถานะ',
      cell: ({ row }: { row: { original: AdminLog } }) => (
        <span
          className={`inline-flex cursor-pointer items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.status === 'Success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'actionDetail',
      header: language === 'en' ? 'Action Detail' : 'รายละเอียดการกระทำ',
      cell: ({ row }: { row: { original: AdminLog } }) => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const detail = row.original;
        let actionDetailObj = detail.actionDetail;
        if (typeof actionDetailObj === 'string') {
          actionDetailObj = JSON.parse(actionDetailObj);
        }
        detail.actionDetail = actionDetailObj;
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="text-blue-600 cursor-pointer hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {language === 'en' ? 'View Details' : 'ดูรายละเอียด'}
            </button>

            {/* Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/70 pacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-lg font-semibold">
                      {language === 'en' ? 'Action Details' : 'รายละเอียดการกระทำ'}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsModalOpen(false);
                      }}
                      className="text-gray-500 cursor-pointer hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 overflow-auto flex-grow bg-gray-50">
                    <pre className="text-sm overflow-auto max-h-[60vh] p-4 bg-gray-800 text-gray-100 rounded-md">
                      <code>
                        {(() => {
                          return JSON.stringify(detail, null, 2);
                        })()}
                      </code>
                    </pre>
                  </div>
                  <div className="border-t p-4 flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 cursor-pointer py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {language === 'en' ? 'Close' : 'ปิด'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      },
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (logs.length === 0) {
    return <div>No logs found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessorKey}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                {language === 'en' ? 'Loading...' : 'กำลังโหลด...'}
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                {language === 'en' ? 'No logs found' : 'ไม่พบข้อมูล'}
              </td>
            </tr>
          ) : (
            logs.map((log, index) => (
              <tr key={log.id}>
                {columns.map((column) => (
                  <td key={`${log.id}-${column.accessorKey}`} className="px-6 py-4 whitespace-nowrap">
                    {column.cell ? (
                      column.cell({
                        row: {
                          original: log,
                          index: index
                        }
                      })
                    ) : (
                      <div className="text-sm text-gray-900">
                        {log[column.accessorKey as keyof AdminLog] as string}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
