import type { Astrologer, Review, ServiceOffering } from '@/types/domain';

/**
 * Experts customers can chat with. All of them are answered by the pandit
 * account; their ids must match the list in `firestore.rules`.
 */
export const ASTROLOGERS: Astrologer[] = [
  {
    id: 'pandit-raghav',
    name: 'Pandit Raghav Shastri',
    photo: require('@/assets/images/experts/pandit-raghav.jpg'),
    tradition: 'vedic',
    specialty: 'Vedic Astrology & Kundli',
    skills: ['career', 'finance', 'marriage'],
    experienceYears: 18,
    rating: 4.9,
    reviewCount: 1240,
    pricePerMinute: 49,
    online: true,
    languages: ['Hindi', 'English'],
    about:
      'Vedic astrologer reading Kundli for career, finance, marriage and life decisions. Clear answers and simple, practical remedies.',
    consultations: 9600,
    verified: true,
  },
  {
    id: 'pandit-devesh',
    name: 'Pandit Devesh Mishra',
    photo: require('@/assets/images/experts/pandit-devesh.jpg'),
    tradition: 'vedic',
    specialty: 'Love, Marriage & Remedies',
    skills: ['love', 'marriage', 'spirituality'],
    experienceYears: 14,
    rating: 4.8,
    reviewCount: 980,
    pricePerMinute: 39,
    online: true,
    languages: ['Hindi', 'English'],
    about:
      'Guidance on love, relationships, marriage matching and family harmony, with remedies rooted in Vedic tradition.',
    consultations: 7200,
    verified: true,
  },
  {
    id: 'maulana-imran',
    name: 'Maulana Imran Qadri',
    photo: require('@/assets/images/experts/maulana-imran.jpg'),
    tradition: 'islamic',
    specialty: 'Islamic Guidance & Istikhara',
    skills: ['marriage', 'family', 'spirituality'],
    experienceYears: 22,
    rating: 4.9,
    reviewCount: 860,
    pricePerMinute: 39,
    online: true,
    languages: ['Urdu', 'Hindi', 'English'],
    about:
      'Islamic scholar offering guidance on marriage, family matters, Istikhara and daily duas, rooted in the Quran and Sunnah.',
    consultations: 6400,
    verified: true,
  },
  {
    id: 'maulana-abdul',
    name: 'Hafiz Abdul Rehman',
    photo: require('@/assets/images/experts/maulana-abdul.jpg'),
    tradition: 'islamic',
    specialty: 'Ruqyah & Spiritual Protection',
    skills: ['protection', 'family', 'spirituality'],
    experienceYears: 15,
    rating: 4.8,
    reviewCount: 640,
    pricePerMinute: 39,
    online: true,
    languages: ['Urdu', 'Hindi'],
    about:
      'Hafiz-e-Quran guiding you through Ruqyah Shariah, protection duas and spiritual cleansing for yourself and your home.',
    consultations: 4800,
    verified: true,
  },
];

export const PANDITS = ASTROLOGERS.filter((a) => a.tradition === 'vedic');
export const MAULANAS = ASTROLOGERS.filter((a) => a.tradition === 'islamic');

/** What customers call this expert in running text, e.g. "the maulana accepts…". */
export function expertNoun(expert?: Astrologer) {
  if (expert?.tradition === 'islamic') return 'maulana';
  if (expert?.tradition === 'vedic') return 'pandit';
  return 'expert';
}

const VEDIC_SERVICES: ServiceOffering[] = [
  { id: 'vedic', icon: 'planet', title: 'Vedic Astrology' },
  { id: 'kundli', icon: 'document-text', title: 'Kundli Analysis' },
  { id: 'career', icon: 'trending-up', title: 'Career Guidance' },
  { id: 'marriage', icon: 'heart', title: 'Marriage Match' },
  { id: 'finance', icon: 'cash', title: 'Financial Growth' },
  { id: 'health', icon: 'fitness', title: 'Health & Wellness' },
];

const ISLAMIC_SERVICES: ServiceOffering[] = [
  { id: 'istikhara', icon: 'compass', title: 'Istikhara' },
  { id: 'ruqyah', icon: 'shield-checkmark', title: 'Ruqyah Shariah' },
  { id: 'marriage', icon: 'heart', title: 'Marriage Guidance' },
  { id: 'family', icon: 'people', title: 'Family Harmony' },
  { id: 'duas', icon: 'book', title: 'Daily Duas' },
  { id: 'protection', icon: 'home', title: 'Home Protection' },
];

const GENERAL_SERVICES: ServiceOffering[] = [
  { id: 'career', icon: 'trending-up', title: 'Career Guidance' },
  { id: 'marriage', icon: 'heart', title: 'Relationships' },
  { id: 'family', icon: 'people', title: 'Family Harmony' },
  { id: 'health', icon: 'fitness', title: 'Wellbeing' },
];

/** Services listed on an expert's profile, matched to their tradition. */
export function servicesFor(expert?: Astrologer): ServiceOffering[] {
  if (expert?.tradition === 'vedic') return VEDIC_SERVICES;
  if (expert?.tradition === 'islamic') return ISLAMIC_SERVICES;
  return GENERAL_SERVICES;
}

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
