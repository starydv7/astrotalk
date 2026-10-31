import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';

export default function QuestionsScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top']}>
      <SubHeader title="My Questions" />
      <EmptyState
        icon="help-circle-outline"
        title="No saved questions yet"
        message="Questions you save during consultations will appear here."
        actionLabel="Start a consultation"
        onAction={() => router.push('/(tabs)/astrologers')}
      />
    </Screen>
  );
}
