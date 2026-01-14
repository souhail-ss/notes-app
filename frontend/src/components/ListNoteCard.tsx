import type { Note, ListItem } from '../types';

interface ListNoteCardProps {
  note: Note;
  onToggleItem: (noteId: number, itemId: string) => void;
}

export function ListNoteCard({ note, onToggleItem }: ListNoteCardProps) {
  if (!note.listItems || note.listItems.length === 0) {
    return <p className="note-card-content">No items in this list</p>;
  }

  return (
    <div className="list-items">
      {note.listItems.map((item: ListItem) => (
        <label
          key={item.id}
          className="list-item"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={item.completed}
            onChange={(e) => {
              e.stopPropagation();
              onToggleItem(note.id, item.id);
            }}
          />
          <span className={item.completed ? 'completed' : ''}>
            {item.text}
          </span>
        </label>
      ))}
    </div>
  );
}
