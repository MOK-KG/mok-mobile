import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { api } from '@/shared/api/client';
import { toUpload } from '@/shared/api/upload';
import { bumpPhotoVersion } from '@/shared/lib/photoVersion';

export function PhotoControls() {
  const { t } = useTranslation();
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.put('/auth/photo', form);
    },
    meta: { successMessage: 'profile.photo.saved' },
    onSuccess: bumpPhotoVersion,
  });
  const remove = useMutation({
    mutationFn: () => api.delete('/auth/photo'),
    meta: { successMessage: 'profile.photo.removed' },
    onSuccess: bumpPhotoVersion,
  });
  const pick = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg', 'image/webp'],
    });
    if (picked.canceled) return;
    upload.mutate(toUpload(picked.assets[0]));
  };
  return (
    <View className="mt-2 flex-row gap-4">
      <Pressable accessibilityRole="button" disabled={upload.isPending} onPress={pick} hitSlop={6}>
        <Text className="font-medium text-[12.5px] text-info">{t('profile.photo.upload')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={remove.isPending}
        onPress={() => remove.mutate()}
        hitSlop={6}
      >
        <Text className="font-medium text-[12.5px] text-info">{t('profile.photo.remove')}</Text>
      </Pressable>
    </View>
  );
}
