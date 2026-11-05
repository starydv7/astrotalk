import type { GuidanceCategory } from '@/types/domain';

/**
 * Icon chip background + icon color per category, matching the reference grid:
 * dark tiles with a soft tinted circle behind a saturated filled icon.
 */
export const CATEGORY_TONES: Record<
  GuidanceCategory['tone'],
  { bg: string; fg: string }
> = {
  love: { bg: 'rgba(245, 69, 110, 0.18)', fg: '#FF4D7E' },
  career: { bg: 'rgba(124, 92, 255, 0.20)', fg: '#9B7BFF' },
  finance: { bg: 'rgba(245, 181, 68, 0.20)', fg: '#F5B544' },
  health: { bg: 'rgba(52, 199, 123, 0.18)', fg: '#2FD27F' },
  family: { bg: 'rgba(245, 181, 68, 0.18)', fg: '#F5B544' },
  spirit: { bg: 'rgba(245, 92, 190, 0.18)', fg: '#F55CBE' },
  education: { bg: 'rgba(245, 92, 92, 0.18)', fg: '#FF6B6B' },
  property: { bg: 'rgba(76, 154, 255, 0.18)', fg: '#4C9AFF' },
};
