export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export type NoteType = 'text' | 'list';

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: number;
  title: string;
  content?: string;
  type: NoteType;
  listItems?: ListItem[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  order: number;
  categoryId: number | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  title: string;
  content?: string;
  type?: NoteType;
  listItems?: ListItem[];
  color?: string;
  categoryId?: number;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  type?: NoteType;
  listItems?: ListItem[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  order?: number;
  categoryId?: number;
}

export const NOTE_COLORS = [
  'transparent',  // No color (default)
  '#77172e',      // Dark Red
  '#7c4a06',      // Dark Brown
  '#264d3b',      // Dark Green
  '#256377',      // Dark Blue
  '#472f5b',      // Dark Purple
];
