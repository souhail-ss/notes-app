import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Note } from '../types';
import { NoteCard } from './NoteCard';

interface SortableNoteCardProps {
  note: Note;
  onPin: (id: number, isPinned: boolean) => void;
  onDelete: (id: number) => void;
  onSelect?: (id: number) => void;
  onColorChange?: (id: number, color: string) => void;
  onDuplicate?: (id: number) => void;
  onToggleItem?: (noteId: number, itemId: string) => void;
  onEdit?: (note: Note) => void;
  isSelected?: boolean;
  isDragging: boolean;
}

export function SortableNoteCard({
  note,
  onPin,
  onDelete,
  onSelect,
  onColorChange,
  onDuplicate,
  onToggleItem,
  onEdit,
  isSelected,
  isDragging,
}: SortableNoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    cursor: isSortableDragging ? 'grabbing' : 'grab',
    boxShadow: isSortableDragging
      ? '0 8px 16px 0 rgba(60,64,67,.3), 0 16px 32px 4px rgba(60,64,67,.15)'
      : undefined,
    zIndex: isSortableDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'dragging' : ''}
    >
      <NoteCard
        note={note}
        onPin={onPin}
        onDelete={onDelete}
        onSelect={onSelect}
        onColorChange={onColorChange}
        onDuplicate={onDuplicate}
        onToggleItem={onToggleItem}
        onEdit={onEdit}
        isSelected={isSelected}
      />
    </div>
  );
}
