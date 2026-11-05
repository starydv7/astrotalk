import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type DialogTone = 'gold' | 'danger' | 'success';

export type DialogOptions = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogApi = {
  alert: (options: DialogOptions) => Promise<void>;
  confirm: (options: DialogOptions) => Promise<boolean>;
};

type Pending = DialogOptions & { kind: 'alert' | 'confirm'; resolve: (ok: boolean) => void };

const TONES: Record<DialogTone, { ring: readonly [string, string]; icon: string; glyph: keyof typeof Ionicons.glyphMap }> = {
  gold: { ring: ['#F6E7C1', '#C6A15A'], icon: '#1A140C', glyph: 'sparkles' },
  danger: { ring: ['#FF8A8A', '#C93A44'], icon: '#FFFFFF', glyph: 'alert' },
  success: { ring: ['#7BE3A8', '#1F9D5F'], icon: '#08140D', glyph: 'checkmark' },
};

const DialogContext = createContext<DialogApi | null>(null);

/** App-wide premium replacement for system alerts and confirms. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Pending | null>(null);
  const queue = useRef<Pending[]>([]);

  const show = useCallback((next: Pending) => {
    setCurrent((active) => {
      if (active) {
        queue.current.push(next);
        return active;
      }
      return next;
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    setCurrent((active) => {
      active?.resolve(ok);
      return queue.current.shift() ?? null;
    });
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: (options) => new Promise<void>((resolve) => show({ ...options, kind: 'alert', resolve: () => resolve() })),
      confirm: (options) => new Promise<boolean>((resolve) => show({ ...options, kind: 'confirm', resolve })),
    }),
    [show],
  );

  const tone = TONES[current?.tone ?? 'gold'];

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={!!current}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => close(false)}>
        {current ? (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={styles.backdrop}>
            <Pressable
              accessibilityLabel="Close dialog"
              style={StyleSheet.absoluteFill}
              onPress={() => current.kind === 'alert' && close(true)}
            />
            <Animated.View entering={ZoomIn.springify().damping(16).stiffness(180)} style={styles.cardWrap}>
              <LinearGradient
                colors={['rgba(246,231,193,0.65)', 'rgba(198,161,90,0.15)', 'rgba(246,231,193,0.45)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.border}>
                <LinearGradient colors={['#1B1533', '#0E0B1E']} style={styles.card}>
                  <View style={styles.glow} />
                  <LinearGradient colors={tone.ring} style={styles.iconRing}>
                    <Ionicons name={current.icon ?? tone.glyph} size={26} color={tone.icon} />
                  </LinearGradient>
                  <Text variant="h3" center style={styles.title}>
                    {current.title}
                  </Text>
                  {current.message ? (
                    <Text variant="body" color="textSecondary" center style={styles.message}>
                      {current.message}
                    </Text>
                  ) : null}
                  <View style={styles.divider} />
                  <View style={styles.actions}>
                    <Button
                      label={current.confirmLabel ?? (current.kind === 'confirm' ? 'Confirm' : 'OK')}
                      variant={current.tone === 'danger' ? 'danger' : 'gold'}
                      onPress={() => close(true)}
                    />
                    {current.kind === 'confirm' ? (
                      <Button
                        label={current.cancelLabel ?? 'Cancel'}
                        variant="secondary"
                        onPress={() => close(false)}
                      />
                    ) : null}
                  </View>
                </LinearGradient>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useDialog must be used inside DialogProvider');
  return value;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 2, 10, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 380,
    shadowColor: '#E8C47A',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  border: { borderRadius: 28, padding: 1 },
  card: { borderRadius: 27, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 22, alignItems: 'center', overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232,196,122,0.12)',
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  title: { color: '#F6E7C1' },
  message: { marginTop: 8, lineHeight: 22 },
  divider: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(232,196,122,0.25)', marginVertical: 20 },
  actions: { alignSelf: 'stretch', gap: 10 },
});
