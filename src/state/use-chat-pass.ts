import { useEffect, useState } from 'react';

import { watchPass } from '@/state/chat-pass';

/** Live pass expiry (ms) for a customer, or 0 when they have none. */
export function usePassUntil(uid: string | null | undefined) {
  const [state, setState] = useState<{ uid: string; until: number } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return watchPass(uid, (until) => setState({ uid, until }));
  }, [uid]);

  return state && state.uid === uid ? state.until : 0;
}
