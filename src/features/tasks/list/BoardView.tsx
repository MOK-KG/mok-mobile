import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCan } from '@/features/auth';
import { toast } from '@/shared/lib/toast';
import { useMoveTask } from '../api';
import type { Column, Task } from '../types';
import { TaskListItem } from './TaskListItem';

const PEEK = 36;

export function BoardView({ columns, tasks }: { columns: Column[]; tasks: Task[] }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { can } = useCan();
  const move = useMoveTask();
  const [moving, setMoving] = useState<Task | null>(null);
  const pageWidth = width - PEEK;
  const sorted = [...columns].sort((a, b) => a.position - b.position);

  const moveTo = (task: Task, column: Column) => {
    setMoving(null);
    move.mutate(
      { id: task.id, columnId: column.id },
      { onError: () => toast.error(t('errors.code.wip_limit')) },
    );
  };

  return (
    <>
      <FlatList
        horizontal
        data={sorted}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: PEEK }}
        renderItem={({ item: column }) => {
          const items = tasks.filter((x) => x.columnId === column.id);
          const full = column.wipLimit !== null && items.length >= column.wipLimit;
          return (
            <View style={{ width: pageWidth }} className="flex-1 pl-4 pt-1">
              <View
                accessibilityRole="header"
                className="mb-2 flex-row items-center gap-2 rounded-9 border border-line bg-column px-3 py-2"
              >
                <Text className="flex-1 font-semibold text-[13px] text-text">{column.name}</Text>
                <Text
                  className={`font-medium text-[12px] ${full ? 'text-warning-text' : 'text-dim'}`}
                >
                  {column.wipLimit !== null ? `${items.length} / ${column.wipLimit}` : items.length}
                </Text>
              </View>
              <ScrollView contentContainerClassName="gap-2 pb-6">
                {items.map((task) => (
                  <View key={task.id} className="overflow-hidden rounded-11 border border-line">
                    <TaskListItem
                      task={task}
                      onPress={() => router.push(`/tasks/${task.id}`)}
                      onLongPress={can('tasks.edit') ? () => setMoving(task) : undefined}
                    />
                  </View>
                ))}
                {items.length === 0 && (
                  <Text className="py-8 text-center font-regular text-[12.5px] text-dim">
                    {t('tasks.emptyColumn')}
                  </Text>
                )}
              </ScrollView>
            </View>
          );
        }}
      />
      <Modal
        transparent
        visible={moving !== null}
        animationType="fade"
        onRequestClose={() => setMoving(null)}
      >
        <Pressable
          accessibilityLabel={t('taskCard.cancel')}
          onPress={() => setMoving(null)}
          className="flex-1 justify-end bg-[rgba(3,6,12,0.6)] p-4"
        >
          <View className="gap-1 rounded-14 border border-line bg-panel p-3">
            <Text className="px-2 pb-1 font-semibold text-[15px] text-text">
              {t('tasks.moveTo')}
            </Text>
            <Text numberOfLines={2} className="px-2 pb-2 font-regular text-[12px] text-dim">
              {moving?.title}
            </Text>
            {sorted
              .filter((c) => c.id !== moving?.columnId)
              .map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  onPress={() => moving && moveTo(moving, c)}
                  className="h-11 justify-center rounded-9 px-3 active:bg-control-active"
                >
                  <Text className="font-medium text-[14px] text-text">{c.name}</Text>
                </Pressable>
              ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
