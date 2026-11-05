import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { traditionInfo } from '@/components/astrology/tradition-mark';

type PanditPortraitProps = {
  photo?: number;
  name: string;
  tradition?: string | null;
  glyphSize?: number;
};

function initials(name: string) {
  const parts = name
    .replace(/^(Pandit|Maulana|Hafiz|Acharya|Mufti|Sheikh)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/**
 * Expert photo. Without one (or if it fails to load) shows the expert's own
 * tradition mark, or a neutral star when the tradition is unknown.
 */
export function PanditPortrait({ photo, name, tradition, glyphSize = 72 }: PanditPortraitProps) {
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <Image
        source={photo}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        onError={() => setFailed(true)}
        accessibilityLabel={name}
      />
    );
  }

  const info = traditionInfo(tradition);
  const letters = initials(name);
  return (
    <LinearGradient
      colors={['#2A1F4F', '#140F2B', '#07060F']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[StyleSheet.absoluteFill, styles.center]}>
      <View style={[styles.halo, { width: glyphSize * 1.7, height: glyphSize * 1.7, borderRadius: glyphSize }]} />
      <MaterialCommunityIcons
        name={info?.icon ?? 'star-four-points'}
        size={glyphSize}
        color={info?.color ?? '#E8C47A'}
      />
      {letters ? (
        <Text style={[styles.initials, { fontSize: Math.max(11, glyphSize * 0.2) }]}>{letters}</Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(232, 196, 122, 0.35)',
    backgroundColor: 'rgba(232, 196, 122, 0.06)',
  },
  initials: { color: '#F6E7C1', letterSpacing: 3, fontWeight: '700', marginTop: 6 },
});
