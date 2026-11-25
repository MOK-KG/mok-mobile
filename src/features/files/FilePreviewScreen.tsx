import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/app/providers/ThemeProvider';
import { shareFile } from '@/shared/api/download';
import { themes } from '@/shared/config/tokens';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function FilePreviewScreen({ uri, name }: { uri: string; name: string }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={name}
        fallback="/"
        right={
          <Pressable
            accessibilityRole="button"
            onPress={() => shareFile(uri)}
            hitSlop={8}
            className="h-8 justify-center rounded-8 px-2"
          >
            <Text className="font-medium text-[13px] text-info">{t('files.share')}</Text>
          </Pressable>
        }
      />
      <WebView
        source={{ uri }}
        originWhitelist={['*']}
        allowFileAccess
        allowingReadAccessToURL={uri}
        javaScriptEnabled={false}
        style={{ flex: 1, backgroundColor: palette.canvas }}
      />
    </SafeAreaView>
  );
}
