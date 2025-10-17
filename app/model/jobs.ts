export interface Company {
  id: string;
  name: string;
  address: string;
  email: string;
  status: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface JobType {
  id: string;
  name: string;
  description: string;
  status: boolean;
}

export interface JobManpower {
  id: string;
  name: string;
  detail?: string;
  contract?: string;
  contractNumber?: string;
  certificate?: string;
}

export interface ScoreData {
  RangeLabel: string;
  MaxScore: number;
}

export interface FormData {
  title: string;
  titleMedia: string;
  jobOwner: string;
  score: string;
  salaryStart: string;
  salaryEnd: string;
  workingHoursPerWeek: number;
  // startDate: string;
  // endDate: string;
  // timeStart: string;
  // timeEnd: string;
  description: string;
  qualifications: string;
  address: string;
  location: string;
  candidateCriteria: string;
  companyID: string | undefined;
  jobTypeID: string | undefined;
  jobManpowerID: string | undefined;
  acceptingPosition: number;
  images: File[];
  videos: File[];
}

export interface MediaPreview {
  url: string;
  type: "image" | "video";
  file?: File;
  id?: string;
}

export interface Job {
  id: string;
  title: string;
  titleMedia?: string;
  jobOwner: string;
  score: string;
  salaryStart: string;
  salaryEnd: string;
  workingHoursPerWeek: number;
  startDate: string;
  endDate: string;
  jobDate: string; // Add this line
  timeStart: string;
  timeEnd: string;
  description: string;
  qualifications: string;
  address: string;
  location: string;
  candidateCriteria: string;
  companyId: string; // API returns companyId (lowercase 'd')
  companyID?: string; // For backward compatibility
  jobTypeId: string; // API returns jobTypeId (lowercase 'd')
  jobTypeID?: string; // For backward compatibility
  jobManpowerId: string; // API returns jobManpowerId (lowercase 'd')
  jobManpowerID?: string; // For backward compatibility
  acceptingPosition: number;
  jobSalary: string;
  jobSalaryStart: string;
  jobSalaryEnd: string;
  jobTime: string;
  images?: string[];
  videos?: string[];
  imagesWithId?: ImageWithId[];
  videosWithId?: VideoWithId[];
  status: boolean;
  // Other fields from API response
  companyName?: string;
  jobTypeName?: string;
  jobManpowerDetail?: {
    id: string;
    name: string;
    detail?: string;
  };
}

export interface ImageWithId {
  id: string;
  jobID?: string;
  imageURL?: string; // New format
  imageUrl?: string; // Old format
  createdAt?: string;
  createdBy?: string;
}

export interface VideoWithId {
  id: string;
  jobID?: string;
  videoURL?: string; // New format
  videoUrl?: string; // Old format
  createdAt?: string;
  createdBy?: string;
}

export interface TitleMediaResponse {
  data?: {
    id?: string;
    titleMedia?: string;
  };
  message?: string;
}

export interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface Company {
  id: string;
  name: string;
}

export interface JobManpower {
  id: string;
  name: string;
}

export interface JobType {
  id: string;
  name: string;
  description: string;
  status: boolean;
}

export interface ScoreData {
  RangeLabel: string;
  MaxScore: number;
}

export interface MediaPreview {
  url: string;
  type: "image" | "video";
  file?: File;
  id?: string; // Add ID field for deletion
}
