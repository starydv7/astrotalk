export type SkySign = {
  id: string;
  label: string;
  glyph: string;
  range: string;
  focus: string;
  line: string;
  /** Month and day the sign begins. */
  start: [number, number];
};

export const SIGNS: SkySign[] = [
  {
    id: 'aries',
    label: 'Aries',
    glyph: '♈',
    range: 'Mar 21 – Apr 19',
    focus: 'Initiative',
    line: 'Begin the conversation you have been rehearsing. Momentum favors a clean first step.',
    start: [3, 21],
  },
  {
    id: 'taurus',
    label: 'Taurus',
    glyph: '♉',
    range: 'Apr 20 – May 20',
    focus: 'Steadiness',
    line: 'Protect what is already working. A slower yes will outlast a glittering maybe.',
    start: [4, 20],
  },
  {
    id: 'gemini',
    label: 'Gemini',
    glyph: '♊',
    range: 'May 21 – Jun 20',
    focus: 'Dialogue',
    line: 'Ask the second question. The useful answer is hiding behind the polite one.',
    start: [5, 21],
  },
  {
    id: 'cancer',
    label: 'Cancer',
    glyph: '♋',
    range: 'Jun 21 – Jul 22',
    focus: 'Home',
    line: 'Choose the room, person, or plan that lets you exhale. Comfort is information.',
    start: [6, 21],
  },
  {
    id: 'leo',
    label: 'Leo',
    glyph: '♌',
    range: 'Jul 23 – Aug 22',
    focus: 'Presence',
    line: 'Be seen doing the thing you are proud of. Warmth opens a door logic cannot.',
    start: [7, 23],
  },
  {
    id: 'virgo',
    label: 'Virgo',
    glyph: '♍',
    range: 'Aug 23 – Sep 22',
    focus: 'Craft',
    line: 'Refine one detail and leave the rest. Precision will do more than a full overhaul.',
    start: [8, 23],
  },
  {
    id: 'libra',
    label: 'Libra',
    glyph: '♎',
    range: 'Sep 23 – Oct 22',
    focus: 'Balance',
    line: 'Name what you actually want before you negotiate. Fairness starts with clarity.',
    start: [9, 23],
  },
  {
    id: 'scorpio',
    label: 'Scorpio',
    glyph: '♏',
    range: 'Oct 23 – Nov 21',
    focus: 'Depth',
    line: 'A private question wants a precise answer. Trust the conversation that does not rush you.',
    start: [10, 23],
  },
  {
    id: 'sagittarius',
    label: 'Sagittarius',
    glyph: '♐',
    range: 'Nov 22 – Dec 21',
    focus: 'Horizon',
    line: 'Look one step past the familiar plan. The wider view is the practical one today.',
    start: [11, 22],
  },
  {
    id: 'capricorn',
    label: 'Capricorn',
    glyph: '♑',
    range: 'Dec 22 – Jan 19',
    focus: 'Structure',
    line: 'Put the ambition on a calendar. Quiet discipline will feel more luxurious than hurry.',
    start: [12, 22],
  },
  {
    id: 'aquarius',
    label: 'Aquarius',
    glyph: '♒',
    range: 'Jan 20 – Feb 18',
    focus: 'Originality',
    line: 'Keep the unusual idea. It is closer to the right answer than the expected one.',
    start: [1, 20],
  },
  {
    id: 'pisces',
    label: 'Pisces',
    glyph: '♓',
    range: 'Feb 19 – Mar 20',
    focus: 'Intuition',
    line: 'Notice what you felt before you explained it. That first signal is the one to follow.',
    start: [2, 19],
  },
];

export const TONIGHT = {
  moon: 'Waxing crescent',
  sky: 'A thin moon over a quiet sky. Good for questions you want answered carefully.',
};

function startKey(sign: SkySign) {
  return sign.start[0] * 100 + sign.start[1];
}

export function signForToday(date = new Date()): SkySign {
  const key = (date.getMonth() + 1) * 100 + date.getDate();
  const sorted = [...SIGNS].sort((a, b) => startKey(a) - startKey(b));
  let pick = sorted[sorted.length - 1];
  for (const sign of sorted) {
    if (startKey(sign) <= key) pick = sign;
  }
  return pick;
}
