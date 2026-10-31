import type { Astrologer, Review, ServiceOffering } from '@/types/domain';

/**
 * SAMPLE astrologer directory used to build and demonstrate the UI.
 * Replace with the `/v1` API once the backend directory endpoints are wired.
 * Avatars use deterministic placeholder portraits.
 */
function portrait(seed: string) {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;
}

export const ASTROLOGERS: Astrologer[] = [
  {
    id: 'acharya-sharma',
    name: 'Acharya Sharma',
    avatarUrl: portrait('acharya-sharma'),
    specialty: 'Vedic Astrology',
    skills: ['career', 'finance', 'love'],
    experienceYears: 12,
    rating: 4.8,
    reviewCount: 2300,
    pricePerMinute: 49,
    online: true,
    languages: ['English', 'Hindi'],
    about:
      'Specializing in Vedic Astrology, Kundli, Career, Marriage, Finance and Life Guidance. Offers simple and practical remedies for a better future.',
    consultations: 18400,
    verified: true,
  },
  {
    id: 'priya-verma',
    name: 'Priya Verma',
    avatarUrl: portrait('priya-verma'),
    specialty: 'Love & Relationship',
    skills: ['love', 'marriage'],
    experienceYears: 8,
    rating: 4.7,
    reviewCount: 1800,
    pricePerMinute: 39,
    online: true,
    languages: ['English', 'Hindi'],
    about:
      'Compassionate relationship guide focused on love, compatibility and emotional clarity. Helps you understand patterns and move forward with confidence.',
    consultations: 12100,
    verified: true,
  },
  {
    id: 'rohit-joshi',
    name: 'Rohit Joshi',
    avatarUrl: portrait('rohit-joshi'),
    specialty: 'Career & Finance',
    skills: ['career', 'finance'],
    experienceYears: 10,
    rating: 4.9,
    reviewCount: 2100,
    pricePerMinute: 45,
    online: false,
    languages: ['English', 'Marathi'],
    about:
      'Career and finance strategist blending astrology with practical planning. Clear guidance on timing, decisions and growth.',
    consultations: 15600,
    verified: true,
  },
  {
    id: 'sneha-kapoor',
    name: 'Sneha Kapoor',
    avatarUrl: portrait('sneha-kapoor'),
    specialty: 'Tarot Reading',
    skills: ['love', 'spirituality'],
    experienceYears: 6,
    rating: 4.6,
    reviewCount: 1300,
    pricePerMinute: 39,
    online: true,
    languages: ['English'],
    about:
      'Intuitive tarot reader helping you reflect on choices, relationships and personal growth with warmth and honesty.',
    consultations: 9800,
    verified: false,
  },
  {
    id: 'vikram-pandit',
    name: 'Vikram Pandit',
    avatarUrl: portrait('vikram-pandit'),
    specialty: 'Numerology',
    skills: ['career', 'finance', 'spirituality'],
    experienceYears: 14,
    rating: 4.7,
    reviewCount: 1900,
    pricePerMinute: 49,
    online: true,
    languages: ['English', 'Hindi', 'Gujarati'],
    about:
      'Numerologist guiding life decisions through numbers, timing and alignment. Focused on clarity and actionable next steps.',
    consultations: 20300,
    verified: true,
  },
];

export const SERVICES: ServiceOffering[] = [
  { id: 'vedic', icon: 'planet', title: 'Vedic Astrology' },
  { id: 'kundli', icon: 'document-text', title: 'Kundli Analysis' },
  { id: 'career', icon: 'trending-up', title: 'Career Guidance' },
  { id: 'marriage', icon: 'heart', title: 'Marriage Match' },
  { id: 'finance', icon: 'cash', title: 'Financial Growth' },
  { id: 'health', icon: 'fitness', title: 'Health & Wellness' },
];

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    author: 'Ananya P.',
    rating: 5,
    timeAgo: '2 days ago',
    text: 'Very accurate and helpful guidance. Really gave me clarity in my career.',
    sentiment: 'positive',
  },
  {
    id: 'r2',
    author: 'Rohan S.',
    rating: 5,
    timeAgo: '5 days ago',
    text: 'Spoke about my relationship issues and the remedies suggested are working.',
    sentiment: 'positive',
  },
  {
    id: 'r3',
    author: 'Neha K.',
    rating: 4,
    timeAgo: '1 week ago',
    text: 'Very calm and positive. Highly recommend for honest, practical advice.',
    sentiment: 'positive',
  },
  {
    id: 'r4',
    author: 'Imran Q.',
    rating: 3,
    timeAgo: '2 weeks ago',
    text: 'Good session overall, though I wanted a little more detail on timing.',
    sentiment: 'critical',
  },
];

export const RATING_BREAKDOWN = [
  { stars: 5, percent: 82 },
  { stars: 4, percent: 15 },
  { stars: 3, percent: 2 },
  { stars: 2, percent: 1 },
  { stars: 1, percent: 1 },
];

export function getAstrologer(id: string): Astrologer | undefined {
  return ASTROLOGERS.find((a) => a.id === id);
}

export const SAMPLE_CHAT = [
  {
    id: 'm1',
    role: 'astrologer' as const,
    text: 'Namaste! How can I help you today? You can ask anything about your life, career, relationships or any other concern.',
    time: '10:24 AM',
  },
  {
    id: 'm2',
    role: 'user' as const,
    text: 'I want to know about my career growth and best time for a job change.',
    time: '10:25 AM',
  },
  {
    id: 'm3',
    role: 'astrologer' as const,
    text: 'Sure, I will read your Kundli and share detailed guidance shortly. Please share your date, time and place of birth.',
    time: '10:26 AM',
  },
];
