export interface StatusOption {
  value: string;
  label: {
    en: string;
    th: string;
  };
}

export const ACTION_TYPE_OPTIONS: StatusOption[] = [
  // User Actions
  {
    value: 'ActionLoginUser',
    label: {
      en: 'Login User',
      th: 'เข้าสู่ระบบ',
    },
  },
  {
    value: 'ActionSearch',
    label: {
      en: 'Job Search',
      th: 'ค้นงาน',
    },
  },
  {
    value: 'ActionJobPosting',
    label: {
      en: 'Job Posting Pages',
      th: 'ประกาศงาน',
    },
  },
  {
    value: 'ActionInsertMapUserJob',
    label: {
      en: 'Interested Job',
      th: 'งานที่สนใจ',
    },
  },
  {
    value: 'ActionDeleteMapUserJob',
    label: {
      en: 'Cancel Interested Job',
      th: 'ยกเลิกงานที่สนใจ',
    },
  },
  {
    value: 'ActionUpdateAssigned',
    label: {
      en: 'Update Assigned',
      th: 'อัปเดตงานที่ส่งมอบ',
    },
  },
  {
    value: 'ActionGetUserAdvisorList',
    label: {
      en: 'Get User Advisor List',
      th: 'ดึงรายการผู้แนะนำ',
    },
  },
  {
    value: 'ActionGetUserPlanMaster',
    label: {
      en: 'Get User Plan Master',
      th: 'ดึงรายการแผน',
    },
  },
  {
    value: 'ActionCreatePlanMaster',
    label: {
      en: 'Create Plan Master',
      th: 'สร้างแผน',
    },
  },
  {
    value: 'ActionNotify',
    label: {
      en: 'Notify',
      th: 'แจ้งเตือน',
    },
  },
  {
    value: 'ActionUpdateProfile',
    label: {
      en: 'Update Profile',
      th: 'อัปเดตโปรไฟล์',
    },
  },
  {
    value: 'ActionUploadAttractFile',
    label: {
      en: 'Upload Attract File',
      th: 'อัปโหลดไฟล์',
    },
  },
  {
    value: 'ActionDeleteAttractFile',
    label: {
      en: 'Delete Attract File',
      th: 'ลบไฟล์',
    },
  },
  {
    value: 'ActionRegisterUser',
    label: {
      en: 'Register User',
      th: 'ลงทะเบียนผู้ใช้',
    },
  },
  {
    value: 'ActionLoginAdmin',
    label: {
      en: 'Login Admin',
      th: 'เข้าสู่ระบบผู้ดูแล',
    },
  },
  {
    value: 'ActionForgotPassword',
    label: {
      en: 'Forgot Password',
      th: 'ลืมรหัสผ่าน',
    },
  },
  {
    value: 'ActionResetPassword',
    label: {
      en: 'Reset Password',
      th: 'รีเซ็ตรหัสผ่าน',
    },
  },
  {
    value: 'ActionGetDashboard',
    label: {
      en: 'Dashboard',
      th: 'แดชบอร์ด',
    },
  },
  {
    value: 'ActionGetNotification',
    label: {
      en: 'Notification Page',
      th: 'หน้าการแจ้งเตือน',
    },
  },
  {
    value: 'ActionGetMapUserJob',
    label: {
      en: 'Applicants List Page',
      th: 'หน้าผู้สมัคร',
    },
  },
  {
    value: 'ActionCreateNotification',
    label: {
      en: 'Send Notification To User',
      th: 'ส่งการแจ้งเตือนถึงผู้ใช้',
    },
  },
  {
    value: 'ActionReadNotification',
    label: {
      en: 'Read Notification',
      th: 'อ่านการแจ้งเตือน',
    },
  },
  {
    value: 'ActionTotalJob',
    label: {
      en: 'Total Jobs Page',
      th: 'หน้าทั้งหมดของงาน',
    },
  },
  {
    value: 'ActionDelayedJob',
    label: {
      en: 'Delayed Jobs Page',
      th: 'หน้างานที่ล่าช้า',
    },
  },
  {
    value: 'ActionSuccessJob',
    label: {
      en: 'Successful Jobs Page',
      th: 'หน้างานที่สำเร็จ',
    },
  },
  {
    value: 'ActionCancelMapUserJob',
    label: {
      en: 'Cancel Interested Job',
      th: 'ยกเลิกงานที่สนใจ',
    },
  },
  {
    value: 'ActionApplicantDetails',
    label: {
      en: 'Applicant Details Pages',
      th: 'หน้ารายละเอียดผู้สมัคร',
    },
  },
  {
    value: 'ActionCreateJob',
    label: {
      en: 'Create Job',
      th: 'สร้างงาน',
    },
  },
  {
    value: 'ActionDeleteJob',
    label: {
      en: 'Delete Job',
      th: 'ลบงาน',
    },
  },
  {
    value: 'ActionUpdateJob',
    label: {
      en: 'Update Job',
      th: 'อัปเดตงาน',
    },
  },
  {
    value: 'ActionGetAdvisorUsers',
    label: {
      en: 'Job Referral List Page',
      th: 'หน้ารายการอ้างอิงงาน',
    },
  },
  {
    value: 'ActionUpdatePayment',
    label: {
      en: 'Update Payment',
      th: 'อัปเดตการชำระเงิน',
    },
  },
  {
    value: 'ActionGetProfile',
    label: {
      en: 'Get Profile',
      th: 'ดูโปรไฟล์',
    },
  },
];

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'All',
    label: {
      en: 'All Statuses',
      th: 'ทุกสถานะ',
    },
  },
  {
    value: 'Success',
    label: {
      en: 'Success',
      th: 'สำเร็จ',
    },
  },
  {
    value: 'Failed',
    label: {
      en: 'Failed',
      th: 'ล้มเหลว',
    },
  },
  {
    value: 'Processing',
    label: {
      en: 'Processing',
      th: 'กำลังดำเนินการ',
    },
  },
  {
    value: 'Warning',
    label: {
      en: 'Warning',
      th: 'คำเตือน',
    },
  },
];