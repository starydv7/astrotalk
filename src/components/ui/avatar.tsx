import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type AvatarProps = {
  /** Remote URL or bundled `require()` image. */
  uri?: string | number | null;
  name?: string;
  size?: number;
  online?: boolean;
  ring?: boolean;
};

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ uri, name, size = 48, online, ring }: AvatarProps) {
  const theme = useAppTheme();
  const dotSize = Math.max(10, Math.round(size * 0.26));
  const [failedUri, setFailedUri] = useState<AvatarProps['uri']>(null);
  const showImage = !!uri && failedUri !== uri;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.surfaceElevated,
            borderWidth: ring ? 2 : StyleSheet.hairlineWidth,
            borderColor: ring ? theme.colors.accentGold : theme.colors.border,
          },
        ]}>
        {showImage ? (
          <Image
            source={typeof uri === 'number' ? uri : { uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            contentFit="cover"
            transition={200}
            onError={() => setFailedUri(uri)}
          />
        ) : (
          <Text variant="title" color="textSecondary" style={{ fontSize: size * 0.36 }}>
            {initials(name)}
          </Text>
        )}
      </View>
      {online !== undefined ? (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: online ? theme.colors.success : theme.colors.textMuted,
              borderColor: theme.colors.background,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dot: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2 },
});
