import { ASTROLOGERS } from '@/data/astrologers';

export type ConversationSummary = {
  id: string;
  astrologerId: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
};

/** SAMPLE recent conversations for the Chat tab. Replace with /v1/conversations. */
export const CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'c1',
    astrologerId: 'acharya-sharma',
    name: 'Acharya Sharma',
    avatarUrl: ASTROLOGERS[0].avatarUrl,
    lastMessage: 'Please share your date, time and place of birth.',
    time: '10:26 AM',
    unread: 1,
    online: true,
  },
  {
    id: 'c2',
    astrologerId: 'priya-verma',
    name: 'Priya Verma',
    avatarUrl: ASTROLOGERS[1].avatarUrl,
    lastMessage: 'That makes a lot of sense. Take your time with this.',
    time: 'Yesterday',
    unread: 0,
    online: true,
  },
  {
    id: 'c3',
    astrologerId: 'rohit-joshi',
    name: 'Rohit Joshi',
    avatarUrl: ASTROLOGERS[2].avatarUrl,
    lastMessage: 'The next quarter looks favorable for a career move.',
    time: 'Mon',
    unread: 0,
    online: false,
  },
];
