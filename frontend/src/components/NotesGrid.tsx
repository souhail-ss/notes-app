import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import Masonry from 'react-masonry-css';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Note } from '../types';
import { NoteCard } from './NoteCard';
import { SortableNoteCard } from './SortableNoteCard';

interface NotesGridProps {
  notes: Note[];
  onPin: (id: number, isPinned: boolean) => void;
  onDelete: (id: number) => void;
  onReorder: (noteId: number, newOrder: number, isPinned: boolean) => void;
  onSelect?: (id: number) => void;
  onColorChange?: (id: number, color: string) => void;
  onDuplicate?: (id: number) => void;
  onToggleItem?: (noteId: number, itemId: string) => void;
  onEdit?: (note: Note) => void;
  selectedNotes?: number[];
}

export function NotesGrid({
  notes,
  onPin,
  onDelete,
  onReorder,
  onSelect,
  onColorChange,
  onDuplicate,
  onToggleItem,
  onEdit,
  selectedNotes = []
}: NotesGridProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  // Masonry breakpoints
  const breakpointColumns = {
    default: 5,
    1600: 4,
    1200: 3,
    900: 2,
    600: 1,
  };

  // Sort notes by order within each section
  const pinnedNotes = notes
    .filter((note) => note.isPinned)
    .sort((a, b) => a.order - b.order);

  const otherNotes = notes
    .filter((note) => !note.isPinned)
    .sort((a, b) => a.order - b.order);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    })
  );

  // Handle drag start - track which note is being dragged
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  // Handle drag end - calculate new order and update
  const handleDragEnd = (event: DragEndEvent, isPinned: boolean) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return; // No change
    }

    const notesInSection = isPinned ? pinnedNotes : otherNotes;
    const oldIndex = notesInSection.findIndex((n) => n.id === active.id);
    const newIndex = notesInSection.findIndex((n) => n.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate new order value
    const newOrder = calculateNewOrder(notesInSection, oldIndex, newIndex);
    onReorder(active.id as number, newOrder, isPinned);
  };

  // Calculate new order value based on surrounding notes
  const calculateNewOrder = (
    notesInSection: Note[],
    oldIndex: number,
    newIndex: number
  ): number => {
    if (newIndex === 0) {
      // Moving to start: get order before first item
      return notesInSection[0].order - 1;
    }

    if (newIndex === notesInSection.length - 1) {
      // Moving to end: get order after last item
      return notesInSection[notesInSection.length - 1].order + 1;
    }

    // Moving between items: average of neighbors
    if (newIndex > oldIndex) {
      // Moving down
      const afterOrder = notesInSection[newIndex].order;
      const beforeOrder = notesInSection[newIndex + 1]?.order ?? afterOrder + 2;
      return (afterOrder + beforeOrder) / 2;
    } else {
      // Moving up
      const afterOrder = notesInSection[newIndex].order;
      const beforeOrder = notesInSection[newIndex - 1]?.order ?? afterOrder - 2;
      return (afterOrder + beforeOrder) / 2;
    }
  };

  // Find active note for drag overlay
  const activeNote = activeId ? notes.find((n) => n.id === activeId) : null;

  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <StickyNote size={64} />
        </div>
        <p className="empty-state-text">No notes yet</p>
        <p className="empty-state-subtext">Create your first note above!</p>
      </div>
    );
  }

  return (
    <div className="notes-container">
      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div className="notes-section">
          <h2 className="section-title">Pinned</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={(event) => handleDragEnd(event, true)}
          >
            <SortableContext
              items={pinnedNotes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <Masonry
                breakpointCols={breakpointColumns}
                className="masonry-grid"
                columnClassName="masonry-column"
              >
                {pinnedNotes.map((note) => (
                  <SortableNoteCard
                    key={note.id}
                    note={note}
                    onPin={onPin}
                    onDelete={onDelete}
                    onSelect={onSelect}
                    onColorChange={onColorChange}
                    onDuplicate={onDuplicate}
                    onToggleItem={onToggleItem}
                    onEdit={onEdit}
                    isSelected={selectedNotes.includes(note.id)}
                    isDragging={activeId === note.id}
                  />
                ))}
              </Masonry>
            </SortableContext>

            <DragOverlay>
              {activeNote && activeNote.isPinned ? (
                <NoteCard
                  note={activeNote}
                  onPin={onPin}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  onColorChange={onColorChange}
                  onDuplicate={onDuplicate}
                  onToggleItem={onToggleItem}
                  onEdit={onEdit}
                  isSelected={selectedNotes.includes(activeNote.id)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Other Notes Section */}
      {otherNotes.length > 0 && (
        <div className="notes-section">
          <h2 className="section-title">
            {pinnedNotes.length > 0 ? 'Other Notes' : 'All Notes'}
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={(event) => handleDragEnd(event, false)}
          >
            <SortableContext
              items={otherNotes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <Masonry
                breakpointCols={breakpointColumns}
                className="masonry-grid"
                columnClassName="masonry-column"
              >
                {otherNotes.map((note) => (
                  <SortableNoteCard
                    key={note.id}
                    note={note}
                    onPin={onPin}
                    onDelete={onDelete}
                    onSelect={onSelect}
                    onColorChange={onColorChange}
                    onDuplicate={onDuplicate}
                    onToggleItem={onToggleItem}
                    onEdit={onEdit}
                    isSelected={selectedNotes.includes(note.id)}
                    isDragging={activeId === note.id}
                  />
                ))}
              </Masonry>
            </SortableContext>

            <DragOverlay>
              {activeNote && !activeNote.isPinned ? (
                <NoteCard
                  note={activeNote}
                  onPin={onPin}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  onColorChange={onColorChange}
                  onDuplicate={onDuplicate}
                  onToggleItem={onToggleItem}
                  onEdit={onEdit}
                  isSelected={selectedNotes.includes(activeNote.id)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
