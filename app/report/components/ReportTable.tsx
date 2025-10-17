import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReportTableProps } from '../types';

export const ReportTable: React.FC<ReportTableProps> = ({
  data,
  loading,
  reportType,
  language
}) => {

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data?.data?.length) {
    return (
      <div className="text-center py-10 text-gray-500">
        {language === 'en' ? 'No data available' : 'ไม่มีข้อมูล'}
      </div>
    );
  }

  const renderStatusBadge = (planName?: string) => {
    if (!planName) return null;

    const statusClasses = {
      'ยื่นใบสมัคร': 'bg-blue-100 text-blue-800',
      'เลือกตำแหน่งงานที่สนใจ': 'bg-yellow-100 text-yellow-800',
      default: 'bg-gray-100 text-gray-800'
    };

    const className =
      statusClasses[planName as keyof typeof statusClasses] || statusClasses.default;

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${className}`}>
        {planName}
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl shadow-sm border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r font-color-white from-blue-600 to-blue-500">
            <tr>
              <TableHeader>{language === 'en' ? 'Job' : 'ตำแหน่งงาน'}</TableHeader>
              <TableHeader>{language === 'en' ? 'Manpower Demand' : 'ผู้ว่าจ้าง'}</TableHeader>
              <TableHeader>{language === 'en' ? 'Manpower Supply' : 'ผู้จัดหา'}</TableHeader>
              <TableHeader>{language === 'en' ? 'User' : 'ผู้ใช้'}</TableHeader>
              <TableHeader>{language === 'en' ? 'Phone' : 'เบอร์โทร'}</TableHeader>
              {(reportType === 'jobapplicants' || reportType === 'reportreferralapplicants') && (
                <TableHeader>{language === 'en' ? 'Status' : 'สถานะ'}</TableHeader>
              )}
              {reportType === 'reportreferralapplicants' && (
                <>
                  <TableHeader>{language === 'en' ? 'Advisor' : 'ผู้แนะนำ'}</TableHeader>
                  <TableHeader>{language === 'en' ? 'Advisor Phone' : 'เบอร์ผู้แนะนำ'}</TableHeader>
                  <TableHeader>{language === 'en' ? 'Advisor Payment' : 'เงินค่าแนะนำ'}</TableHeader>
                </>
              )}
              <TableHeader>{language === 'en' ? 'Created At' : 'วันที่สร้าง'}</TableHeader>
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-200">
          {data.data.map((item, index) => (
            <tr key={index} className="hover:bg-blue-50 transition-colors duration-150 even:bg-gray-50">
              <TableCell>{item.job}</TableCell>
              <TableCell>{item.manpower_demand}</TableCell>
              <TableCell>{item.manpower_supply}</TableCell>
              <TableCell>{item.user}</TableCell>
              <TableCell>{item.phone}</TableCell>
              {(reportType === 'jobapplicants' || reportType === 'reportreferralapplicants') && (
                <TableCell>{renderStatusBadge(item.plan_name)}</TableCell>
              )}
              {reportType === 'reportreferralapplicants' && (
                <>
                  <TableCell>{item.advisor_name}</TableCell>
                  <TableCell>{item.advisor_number}</TableCell>
                  <TableCell>{
                    (() => {
                      const payment = item.advisor_payment;
                      if (payment === true || payment === 'true' || payment === '1') {
                        return language === 'en' ? 'Paid' : 'จ่ายแล้ว';
                      }
                      return language === 'en' ? 'Unpaid' : 'ยังไม่จ่าย';
                    })()
                  }</TableCell>
                </>
              )}
              <TableCell>
                {new Date(item.created_at).toLocaleDateString(
                  language === 'en' ? 'en-US' : 'th-TH'
                )}
              </TableCell>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
      </div>
  );
};

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="py-3 px-4 text-sm text-gray-900 border-b">
    {children}
  </td>
);
