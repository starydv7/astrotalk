import type { GuidanceCategory } from '@/types/domain';

/**
 * Guidance categories shown on Home and the Categories screen.
 * `icon` values are MaterialCommunityIcons glyph names, chosen to match
 * the product reference (heart, briefcase, stacked coins, leaf, rings,
 * lotus, open book, house).
 */
export const CATEGORIES: GuidanceCategory[] = [
  {
    id: 'love',
    title: 'Love & Relationships',
    subtitle: 'Find harmony in your relationships',
    icon: 'heart',
    tone: 'love',
  },
  {
    id: 'career',
    title: 'Career & Business',
    subtitle: 'Make the right career decisions',
    icon: 'briefcase',
    tone: 'career',
  },
  {
    id: 'finance',
    title: 'Finance & Wealth',
    subtitle: 'Attract prosperity and stability',
    icon: 'cash-multiple',
    tone: 'finance',
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    subtitle: 'Guidance for a healthier life',
    icon: 'leaf',
    tone: 'health',
  },
  {
    id: 'marriage',
    title: 'Marriage & Family',
    subtitle: 'Build a happy family life',
    icon: 'ring',
    tone: 'family',
  },
  {
    id: 'spirituality',
    title: 'Spirituality & Life Purpose',
    subtitle: 'Discover your true path',
    icon: 'flower-tulip',
    tone: 'spirit',
  },
  {
    id: 'education',
    title: 'Education & Exams',
    subtitle: 'Guidance for studies and success',
    icon: 'book-open-variant',
    tone: 'education',
  },
  {
    id: 'property',
    title: 'Property & Real Estate',
    subtitle: 'Best time for buying or investing',
    icon: 'home',
    tone: 'property',
  },
];

/** Compact chip set for the Home screen quick access (MaterialCommunityIcons glyphs). */
export const HOME_CHIPS: { id: GuidanceCategory['id'] | 'more'; label: string; icon: string }[] = [
  { id: 'love', label: 'Love', icon: 'heart' },
  { id: 'career', label: 'Career', icon: 'briefcase' },
  { id: 'finance', label: 'Finance', icon: 'cash-multiple' },
  { id: 'health', label: 'Health', icon: 'leaf' },
  { id: 'marriage', label: 'Marriage', icon: 'ring' },
  { id: 'spirituality', label: 'Spirituality', icon: 'flower-tulip' },
  { id: 'education', label: 'Life Path', icon: 'compass' },
  { id: 'more', label: 'More', icon: 'dots-grid' },
];
