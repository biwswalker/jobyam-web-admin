export interface ReportItem {
  job: string;
  manpower_demand: string;
  manpower_supply: string;
  user: string;
  phone: string;
  plan_name?: string;
  advisor_name?: string;
  advisor_number?: string;
  advisor_payment?: boolean | string;
  created_at: string;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

export interface ApiReportData {
  data: ReportItem[];
  pagination: Pagination;
}

export interface ReportData extends Omit<ApiReportData, 'pagination'> {
  data: ReportItem[];
  current_page: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

// export interface ReportResponse {
//   code: number;
//   status: string;
//   data: ApiReportData;
// }

export interface ReportResponse {
  [x: string]: any;
  code: number;
  status: string;
  data: {
    data: ReportItem[];
    pagination: Pagination;
  }
}

export interface ReportTableProps {
  data: ReportData | null;
  loading: boolean;
  reportType: string;
  language: string;
}

export interface ReportTitles {
  [key: string]: {
    en: string;
    th: string;
  };
}

export const REPORT_TITLES: ReportTitles = {
  interestedusers: { en: 'Interested Users Report', th: 'รายงานผู้สนใจ' },
  jobapplicants: { en: 'Job Applicants Report', th: 'รายงานผู้สมัครงาน' },
  reportreferralapplicants: { en: 'Referral Applicants Report', th: 'รายงานผู้แนะนำ' }
};
