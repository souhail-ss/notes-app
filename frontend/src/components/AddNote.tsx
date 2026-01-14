import { useState } from 'react';
import { NOTE_COLORS } from '../types';
import type { Category, CreateNoteDto } from '../types';

interface AddNoteProps {
  categories: Category[];
  onAdd: (note: CreateNoteDto) => void;
}

export function AddNote({ categories, onAdd }: AddNoteProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    
    onAdd({
      title: title.trim(),
      content: content.trim(),
      color,
      categoryId,
    });
    
    // Reset form
    setTitle('');
    setContent('');
    setColor(NOTE_COLORS[0]);
    setCategoryId(undefined);
  };

  return (
    <div className="add-note-container">
      <div 
        className="add-note-form"
        style={{ 
          transition: 'background-color 0.2s ease'
        }}
      >
        <input
          type="text"
          className="add-note-title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ backgroundColor: 'transparent' }}
        />
        <textarea
          className="add-note-content"
          placeholder="Take a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ backgroundColor: 'transparent' }}
        />
        
        <div className="add-note-footer">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="color-picker">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-dot ${color === c ? 'selected' : ''}`}
                  style={{
                    backgroundColor: c,
                    border: c === 'transparent' ? '1px solid var(--text-muted)' : undefined
                  }}
                  onClick={() => setColor(c)}
                  type="button"
                />
              ))}
            </div>
            
            <select
              className="category-select"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            className="add-note-btn"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
