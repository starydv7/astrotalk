import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const withGoogle = iosUrlScheme?.startsWith('com.googleusercontent.apps.') && iosUrlScheme.length > 27;

  return {
    ...config,
    name: config.name ?? 'AstroTalk',
    slug: config.slug ?? 'astrotalk',
    plugins: [
      ...(config.plugins ?? []),
      ...(withGoogle ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, object]] : []),
    ],
  };
};
