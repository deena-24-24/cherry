export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export interface HrConversation {
  id: string;
  hrAgentName: string;
  company: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl?: string;
}