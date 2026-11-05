import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-provider';
import { watchDesk, type Desk } from '@/state/live-chats';

/** Live pandit availability and accept window, shared with customers. */
export function useDesk(): Desk | null {
  const { user } = useAuth();
  const [desk, setDesk] = useState<Desk | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchDesk(setDesk);
  }, [user]);

  return desk;
}
