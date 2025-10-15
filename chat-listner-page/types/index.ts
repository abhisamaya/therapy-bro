export interface Listener {
  id: number;
  login_id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  avatar_url?: string;
}

export interface Message {
  _id?: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  status?: string;
}

export interface Conversation {
  conversation_id: string;
  participant_id: string;
  participant_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface AuthResponse {
  access_token: string;
}

export interface RegisterData {
  login_id: string;
  password: string;
  name: string;
  phone?: string;
  age?: number;
}

export interface LoginData {
  login_id: string;
  password: string;
}
