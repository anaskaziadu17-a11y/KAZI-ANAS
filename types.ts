export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AIAnalysis {
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  sentimentScore: number; // -1 to 1
  tags: string[];
  summary: string;
  advice: string;
  moodEmoji: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string; // ISO string
  updatedAt: string;
  analysis?: AIAnalysis;
}

export type ViewState = 'AUTH' | 'LIST' | 'CREATE' | 'EDIT';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
