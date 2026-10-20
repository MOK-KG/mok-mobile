import type { ComponentType } from 'react';
import type { Section } from '@/shared/config/permissions';
import {
  AccessIcon,
  CalendarIcon,
  ChatIcon,
  DashboardIcon,
  DocumentsIcon,
  FilesIcon,
  KnowledgeIcon,
  TasksIcon,
} from './icons';

/** Иконки разделов — те же, что в боковом меню web */
export const sectionIcons: Record<Section, ComponentType<{ size?: number; color: string }>> = {
  dashboard: DashboardIcon,
  tasks: TasksIcon,
  calendar: CalendarIcon,
  chat: ChatIcon,
  knowledge: KnowledgeIcon,
  documents: DocumentsIcon,
  files: FilesIcon,
  access: AccessIcon,
};
