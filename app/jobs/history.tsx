import React, { useState } from 'react';

// Mock data for job history
const jobHistoryData = [
  {
    id: 1,
    title: 'โปรแกรมเมอร์ (Programmer)',
    company: 'บริษัท เทคโนโลยี จำกัด',
    postedDate: '15 ม.ค. 2568',
    closedDate: '15 ก.พ. 2568',
    status: 'closed',
    applicants: 24,
    views: 156
  },
  {
    id: 2,
    title: 'นักการตลาดดิจิทัล (Digital Marketer)',
    company: 'บริษัท มาร์เก็ตติ้ง โซลูชั่น จำกัด',
    postedDate: '20 ม.ค. 2568',
    closedDate: '20 ก.พ. 2568',
    status: 'closed',
    applicants: 18,
    views: 132
  },
  {
    id: 3,
    title: 'นักออกแบบ UX/UI (UX/UI Designer)',
    company: 'บริษัท ครีเอทีฟ ดีไซน์ จำกัด',
    postedDate: '25 ม.ค. 2568',
    closedDate: '25 ก.พ. 2568',
    status: 'closed',
    applicants: 15,
    views: 120
  },
  {
    id: 4,
    title: 'ผู้จัดการฝ่ายบุคคล (HR Manager)',
    company: 'บริษัท ทรัพยากรบุคคล จำกัด',
    postedDate: '01 ก.พ. 2568',
    closedDate: '01 มี.ค. 2568',
    status: 'closed',
    applicants: 12,
    views: 98
  },
  {
    id: 5,
    title: 'นักบัญชี (Accountant)',
    company: 'บริษัท การเงินและบัญชี จำกัด',
    postedDate: '05 ก.พ. 2568',
    closedDate: '05 มี.ค. 2568',
    status: 'closed',
    applicants: 20,
    views: 110
  }
];

export default function JobHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter jobs based on search term
  const filteredJobs = jobHistoryData.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ประวัติประกาศงาน</h1>
          <p className="text-gray-600 mt-1">ดูประวัติประกาศงานที่หมดอายุหรือปิดรับสมัครแล้ว</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาตำแหน่งงานหรือบริษัท..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">ช่วงเวลา</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="all">ทั้งหมด</option>
              <option value="1month">1 เดือนที่ผ่านมา</option>
              <option value="3months">3 เดือนที่ผ่านมา</option>
              <option value="6months">6 เดือนที่ผ่านมา</option>
              <option value="1year">1 ปีที่ผ่านมา</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">เรียงตาม</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="newest">ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
              <option value="most_applicants">ผู้สมัครมากสุด</option>
              <option value="most_views">ยอดดูมากสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job history table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ตำแหน่งงาน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่ประกาศ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่ปิดรับสมัคร
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ผู้สมัคร
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ยอดดู
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{job.title}</div>
                  <div className="text-sm text-gray-500">{job.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{job.postedDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{job.closedDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.applicants}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.views}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">ดูรายละเอียด</button>
                    <button className="text-green-600 hover:text-green-900">เปิดใหม่</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-700">
          แสดง <span className="font-medium">1</span> ถึง <span className="font-medium">{filteredJobs.length}</span> จาก <span className="font-medium">{filteredJobs.length}</span> รายการ
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            ก่อนหน้า
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
