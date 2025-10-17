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

export interface Manpower {
  id: string;
  name: string;
  detail: string;
  contract: string;
  contractNumber: string;
  certificate: string;
  address: string;
  location: string;
  status: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface ImageWithId {
  id: string;
  jobID?: string;
  imageURL?: string;  // New format
  imageUrl?: string;  // Old format
  createdAt?: string;
  createdBy?: string;
}

export interface UserData {
  id: string;
  name: string;
  phone: string;
  user_name?: string;
  email?: string;
  address?: string;
  agentKey?: string;
  birthDay?: string;
  contactName?: string;
  contactNumber?: string;
  contact_name?: string;
  contact_number?: string;
  notifications?: any;
  relationship?: string;
  company?: Company;
  manpower?: Manpower;
  role?: Role;
}
