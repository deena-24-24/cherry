import { User } from './user'

export interface Message {
  timestamp: string;
  from: User;
  message: string;
}