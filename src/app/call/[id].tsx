import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Waveform } from '@/components/voice/waveform';
import { getAstrologer } from '@/data/astrologers';
import { useAppTheme } from '@/theme/theme-provider';
import type { CallState } from '@/types/domain';

function stateLabel(state: CallState): string {
  switch (state) {
    case 'initializing':
      return 'Initializing…';
    case 'permission':
      return 'Requesting microphone…';
    case 'connecting':
      return 'Connecting…';
    case 'connected':
      return 'Connected';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'ended':
      return 'Call ended';
    case 'failed':
      return 'Connection failed';
  }
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id, video } = useLocalSearchParams<{ id: string; video?: string }>();
  const astrologer = getAstrologer(String(id));
  const isVideo = video === '1';

  const [state, setState] = useState<CallState>('initializing');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated connection lifecycle. Real integration replaces this with the
  // voice provider session (e.g. ElevenLabs agent) using a backend signed URL.
  useEffect(() => {
    const t1 = setTimeout(() => setState('permission'), 600);
    const t2 = setTimeout(() => setState('connecting'), 1300);
    const t3 = setTimeout(() => setState('connected'), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (state === 'connected') {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [state]);

  function endCall() {
    setState('ended');
    if (timer.current) clearInterval(timer.current);
    setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')), 500);
  }

  const connected = state === 'connected';

  return (
    <LinearGradient colors={['#0A0B1E', '#1A1142', '#241056']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Text variant="caption" color="textSecondary">
            {isVideo ? 'Video call' : 'Voice call'}
          </Text>
          <Text variant="h3">{astrologer?.name ?? 'Astrologer'}</Text>
          <Text variant="caption" color={state === 'failed' ? 'danger' : 'accentGold'}>
            {connected ? formatDuration(seconds) : stateLabel(state)}
          </Text>
        </View>

        <View style={styles.center}>
          <View style={styles.avatarGlow}>
            <View
              style={[
                styles.pulse,
                { borderColor: connected ? 'rgba(245,181,68,0.25)' : 'rgba(164,139,255,0.2)' },
              ]}
            />
            <Avatar uri={astrologer?.avatarUrl} name={astrologer?.name} size={160} ring />
          </View>

          <View style={styles.waveWrap}>
            <Waveform active={connected && !muted} />
          </View>

          <Text variant="caption" color="textSecondary">
            {connected ? (muted ? 'Microphone muted' : 'Listening…') : stateLabel(state)}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <ControlBtn
            icon={muted ? 'mic-off' : 'mic'}
            label="Mute"
            active={muted}
            onPress={() => setMuted((m) => !m)}
          />
          <ControlBtn
            icon={speaker ? 'volume-high' : 'volume-mute'}
            label="Speaker"
            active={speaker}
            onPress={() => setSpeaker((s) => !s)}
          />
          <ControlBtn icon="videocam" label="Video" onPress={() => {}} />
        </View>

        <View style={styles.endWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="End call"
            onPress={endCall}
            style={({ pressed }) => [
              styles.endBtn,
              { backgroundColor: theme.colors.danger },
              pressed ? { opacity: 0.85 } : null,
            ]}>
            <Ionicons name="call" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ControlBtn({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.controlBtn,
          {
            backgroundColor: active ? theme.colors.accentGold : 'rgba(255,255,255,0.12)',
          },
          pressed ? { opacity: 0.85 } : null,
        ]}>
        <Ionicons name={icon} size={24} color={active ? '#1A1206' : '#FFFFFF'} />
      </Pressable>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 16, gap: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  avatarGlow: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2 },
  waveWrap: { height: 60, justifyContent: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 24 },
  control: { alignItems: 'center', gap: 8 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  endWrap: { alignItems: 'center', paddingBottom: 24 },
  endBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
