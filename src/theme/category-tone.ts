import type { GuidanceCategory } from '@/types/domain';

/** Soft background + accent color per category, matching the mockup grid. */
export const CATEGORY_TONES: Record<
  GuidanceCategory['tone'],
  { bg: string; fg: string }
> = {
  love: { bg: 'rgba(245, 69, 92, 0.14)', fg: '#FF6B81' },
  career: { bg: 'rgba(76, 154, 255, 0.14)', fg: '#4C9AFF' },
  finance: { bg: 'rgba(52, 199, 123, 0.14)', fg: '#34C77B' },
  health: { bg: 'rgba(245, 69, 92, 0.12)', fg: '#FF7A8A' },
  family: { bg: 'rgba(245, 165, 36, 0.16)', fg: '#F5A524' },
  spirit: { bg: 'rgba(124, 92, 255, 0.16)', fg: '#A48BFF' },
  education: { bg: 'rgba(245, 181, 68, 0.16)', fg: '#F5B544' },
  property: { bg: 'rgba(76, 154, 255, 0.12)', fg: '#5BA8FF' },
};
