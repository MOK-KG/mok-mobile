import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ApiError } from '@/shared/api/errors';
import { themes } from '@/shared/config/tokens';
import { CheckIcon, XIcon } from '@/shared/ui/icons';
import { SECTION_NAME_MAX, SECTION_NAME_MIN, useCreateSection } from './api';
import type { KbSection } from './types';

/**
 * Окно «Новый раздел» из редактора статьи (как SectionDialog в web). Право knowledge.edit
 * проверяет маршрут редактора. Созданный раздел возвращается в onCreated.
 */
export function SectionSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (section: KbSection) => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center bg-[rgba(3,6,12,0.6)] px-4">
          {/* Форма монтируется заново при каждом открытии — поле и ошибка начинаются пустыми */}
          {open && <SectionForm onClose={onClose} onCreated={onCreated} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (section: KbSection) => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const create = useCreateSection();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (create.isPending) return;
    const clean = name.trim();
    if (clean.length < SECTION_NAME_MIN || clean.length > SECTION_NAME_MAX) {
      setError(t('knowledge.errorSectionName', { min: SECTION_NAME_MIN, max: SECTION_NAME_MAX }));
      return;
    }
    try {
      const section = await create.mutateAsync(clean);
      onCreated(section);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'section_exists'
          ? t('knowledge.errorSectionExists', { name: clean.replace(/\s+/g, ' ') })
          : t('knowledge.sectionCreateError'),
      );
    }
  };

  return (
    <View accessibilityViewIsModal className="rounded-18 border border-line bg-panel p-5">
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="font-semibold text-[17px] tracking-[-0.3px] text-text"
          >
            {t('knowledge.newSection')}
          </Text>
          <Text className="mt-1 font-regular text-[12px] leading-4 text-faint">
            {t('knowledge.newSectionHint')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('knowledge.cancel')}
          onPress={onClose}
          hitSlop={8}
          className="size-8 items-center justify-center rounded-8"
        >
          <XIcon size={16} color={palette.faint} />
        </Pressable>
      </View>

      <Text className="mt-4 font-medium text-[11px] tracking-[0.2px] text-sub">
        {t('knowledge.sectionName')}
      </Text>
      <TextInput
        autoFocus
        value={name}
        maxLength={SECTION_NAME_MAX + 20}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        onSubmitEditing={submit}
        returnKeyType="done"
        placeholder={t('knowledge.sectionNamePlaceholder')}
        placeholderTextColor={palette.dim}
        accessibilityLabel={t('knowledge.sectionName')}
        accessibilityState={{ disabled: create.isPending }}
        className={`mt-[6px] h-[44px] rounded-8 border bg-column px-[13px] font-regular text-[13.5px] text-text ${
          error ? 'border-danger' : 'border-line'
        }`}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="mt-1 font-regular text-[11.5px] text-danger"
        >
          {error}
        </Text>
      )}

      <View className="mt-5 flex-row justify-end gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          className="h-10 justify-center rounded-9 border border-line px-4"
        >
          <Text className="font-medium text-[13px] text-sub">{t('knowledge.cancel')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: create.isPending }}
          disabled={create.isPending}
          onPress={submit}
          className={`h-10 flex-row items-center gap-[6px] rounded-9 bg-brand-red px-4 active:opacity-80 ${
            create.isPending ? 'opacity-60' : ''
          }`}
        >
          <CheckIcon size={14} color="#FFFFFF" />
          <Text className="font-semibold text-[13px] text-[#FFFFFF]">
            {t('knowledge.createSection')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
