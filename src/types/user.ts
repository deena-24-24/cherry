export interface User {
  _id: string;
  email: string;
  role: 'candidate' | 'hr';
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  about?: string;
  avatar?: string;
  companyName?: string;
  position?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
}
