import type { UserProfile } from '@/types/domain';

/** SAMPLE signed-in user. Replace with GET /v1/me once auth is wired. */
export const DEMO_USER: UserProfile = {
  id: 'u1',
  name: 'Pawan Yadav',
  phone: '+91 88765 43210',
  email: 'pawan@example.com',
  avatarUrl: 'https://i.pravatar.cc/300?u=pawan-yadav',
  walletBalance: 250,
  isPremium: false,
};
