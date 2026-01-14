import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { NOTE_COLORS } from '../types';
import type { Category, CreateNoteDto, UpdateNoteDto, NoteType, ListItem, Note } from '../types';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd?: (note: CreateNoteDto) => void;
  onEdit?: (id: number, note: UpdateNoteDto) => void;
  mode: 'create' | 'edit';
  initialNote?: Note;
}

export function EditNoteModal({ isOpen, onClose, categories, onAdd, onEdit, mode, initialNote }: EditNoteModalProps) {
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [isClosing, setIsClosing] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && initialNote) {
      setNoteType(initialNote.type || 'text');
      setTitle(initialNote.title);
      setContent(initialNote.content || '');
      setListItems(initialNote.listItems || []);
      setColor(initialNote.color || NOTE_COLORS[0]);
      setCategoryId(initialNote.categoryId ?? undefined);
    } else if (mode === 'create') {
      // Reset form for create mode
      setNoteType('text');
      setTitle('');
      setContent('');
      setListItems([]);
      setNewItemText('');
      setColor(NOTE_COLORS[0]);
      setCategoryId(undefined);
    }
  }, [mode, initialNote]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match animation duration
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const addListItem = () => {
    if (!newItemText.trim() || listItems.length >= 20) return;

    const newItem: ListItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
    };

    setListItems([...listItems, newItem]);
    setNewItemText('');
  };

  const removeListItem = (id: string) => {
    setListItems(listItems.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Validate based on note type
    if (noteType === 'text' && !content.trim()) return;
    if (noteType === 'list' && listItems.length === 0) return;

    if (mode === 'create' && onAdd) {
      onAdd({
        title: title.trim(),
        content: noteType === 'text' ? content.trim() : undefined,
        type: noteType,
        listItems: noteType === 'list' ? listItems : undefined,
        color,
        categoryId,
      });
    } else if (mode === 'edit' && onEdit && initialNote) {
      onEdit(initialNote.id, {
        title: title.trim(),
        content: noteType === 'text' ? content.trim() : undefined,
        type: noteType,
        listItems: noteType === 'list' ? listItems : undefined,
        color,
        categoryId,
      });
    }

    // Reset form
    setNoteType('text');
    setTitle('');
    setContent('');
    setListItems([]);
    setNewItemText('');
    setColor(NOTE_COLORS[0]);
    setCategoryId(undefined);

    handleClose();
  };

  const handleCancel = () => {
    // Reset form
    setNoteType('text');
    setTitle('');
    setContent('');
    setListItems([]);
    setNewItemText('');
    setColor(NOTE_COLORS[0]);
    setCategoryId(undefined);

    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? 'Add New Note' : 'Edit Note'}</h2>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Type Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setNoteType('text')}
              style={{
                padding: '8px 16px',
                background: noteType === 'text' ? 'var(--primary)' : 'transparent',
                color: noteType === 'text' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 150ms',
              }}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setNoteType('list')}
              style={{
                padding: '8px 16px',
                background: noteType === 'list' ? 'var(--primary)' : 'transparent',
                color: noteType === 'list' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 150ms',
              }}
            >
              Create list
            </button>
          </div>

          <form className="add-note-form-modal" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <input
              type="text"
              className="add-note-title-input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            {noteType === 'text' ? (
              <textarea
                className="add-note-content-textarea"
                placeholder="Take a note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            ) : (
              <div style={{ marginBottom: '16px' }}>
                {/* List Items */}
                {listItems.length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {listItems.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                        <span style={{ flex: 1, fontSize: '0.875rem' }}>{item.text}</span>
                        <button
                          type="button"
                          onClick={() => removeListItem(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--error)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Item Input */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Add list item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addListItem();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '0.875rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                    disabled={listItems.length >= 20}
                  />
                  <button
                    type="button"
                    onClick={addListItem}
                    disabled={!newItemText.trim() || listItems.length >= 20}
                    style={{
                      padding: '10px',
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: !newItemText.trim() || listItems.length >= 20 ? 0.5 : 1,
                    }}
                    title="Add item"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {listItems.length >= 20 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Maximum 20 items reached
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="color-picker">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-dot ${color === c ? 'selected' : ''}`}
                    style={{
                      backgroundColor: c,
                      border: c === 'transparent' ? '1px solid var(--border)' : undefined
                    }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              <select
                className="category-select"
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !title.trim() ||
              (noteType === 'text' && !content.trim()) ||
              (noteType === 'list' && listItems.length === 0)
            }
            style={{
              padding: '8px 24px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 500,
              fontSize: '0.875rem',
              opacity: (
                !title.trim() ||
                (noteType === 'text' && !content.trim()) ||
                (noteType === 'list' && listItems.length === 0)
              ) ? 0.5 : 1,
            }}
          >
            {mode === 'create' ? 'Add Note' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
