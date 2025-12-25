export interface User {
  _id: string;
  email: string;
  role: 'candidate' | 'hr';
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  about?: string;
  avatar?: string;
  companyName?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
}