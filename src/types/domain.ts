/** Core domain types shared across Astro Talk screens. */

export type ConsultationMode = 'chat' | 'voice' | 'video';

export type GuidanceCategoryId =
  | 'love'
  | 'career'
  | 'finance'
  | 'health'
  | 'marriage'
  | 'spirituality'
  | 'education'
  | 'property';

export type GuidanceCategory = {
  id: GuidanceCategoryId;
  title: string;
  subtitle: string;
  icon: string; // Ionicons glyph
  tone: 'love' | 'career' | 'finance' | 'health' | 'family' | 'spirit' | 'education' | 'property';
};

export type Astrologer = {
  id: string;
  name: string;
  avatarUrl: string;
  specialty: string;
  skills: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  pricePerMinute: number;
  online: boolean;
  languages: string[];
  about: string;
  consultations: number;
  verified: boolean;
};

export type ServiceOffering = {
  id: string;
  icon: string;
  title: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  timeAgo: string;
  text: string;
  sentiment: 'positive' | 'critical';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'astrologer';
  text: string;
  time: string;
};

export type CallState =
  | 'initializing'
  | 'permission'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

export type UserProfile = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  walletBalance: number;
  isPremium: boolean;
};
