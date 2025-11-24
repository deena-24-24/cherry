export interface User {
  _id: string;
  email: string;
  role: 'candidate' | 'hr';
  isVerified?: boolean;
  profileCompleted?: boolean;
}
