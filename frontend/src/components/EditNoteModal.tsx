import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Mic, MicOff, Loader } from 'lucide-react';
import { NOTE_COLORS } from '../types';
import type { Category, CreateNoteDto, UpdateNoteDto, NoteType, ListItem, Note, VoiceState } from '../types';
import { voiceApi } from '../services/api';

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

  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcription, setTranscription] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptionRef = useRef('');
  const stoppedByUserRef = useRef(false);

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

  // Reset voice state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopRecognition();
      setVoiceState('idle');
      setTranscription('');
      setVoiceError('');
    }
  }, [isOpen]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, []);

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

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  };

  const handleVoiceToggle = async () => {
    if (voiceState === 'listening') {
      // Stop listening and process
      stoppedByUserRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (voiceState === 'processing') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceState('error');
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately — we just needed the permission
      stream.getTracks().forEach(track => track.stop());
    } catch {
      setVoiceState('error');
      setVoiceError('Microphone access denied. Please allow microphone permission in your browser settings.');
      return;
    }

    // Start listening
    setVoiceState('listening');
    setTranscription('');
    setVoiceError('');
    transcriptionRef.current = '';
    stoppedByUserRef.current = false;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      transcriptionRef.current = fullTranscript;
      setTranscription(fullTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setVoiceError('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else if (event.error === 'aborted') {
        // Ignore aborted — user or code stopped it
        return;
      } else {
        setVoiceError(`Speech recognition error: ${event.error}`);
      }
      setVoiceState('error');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      if (stoppedByUserRef.current) {
        // User clicked stop — process the transcription
        recognitionRef.current = null;
        const finalText = transcriptionRef.current;
        if (finalText.trim()) {
          processTranscription(finalText.trim());
        } else {
          setVoiceState('idle');
        }
      } else {
        // Recognition ended on its own (silence/timeout) — restart it
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          setVoiceState('idle');
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processTranscription = async (text: string) => {
    setVoiceState('processing');
    try {
      const result = await voiceApi.parse(text);

      // Auto-fill form fields from parsed result
      setTitle(result.title);
      if (result.type === 'list' && result.items) {
        setNoteType('list');
        setListItems(
          result.items.map((item, i) => ({
            id: `voice-${Date.now()}-${i}`,
            text: item,
            completed: false,
          }))
        );
        setContent('');
      } else {
        setNoteType('text');
        setContent(result.content || '');
        setListItems([]);
      }

      // Map color name to closest NOTE_COLORS hex value
      if (result.color) {
        const colorMap: Record<string, string> = {
          // Red family → Dark Red (#77172e)
          red: NOTE_COLORS[1],
          pink: NOTE_COLORS[1],
          rose: NOTE_COLORS[1],
          crimson: NOTE_COLORS[1],
          maroon: NOTE_COLORS[1],
          // Brown/Yellow/Orange family → Dark Brown (#7c4a06)
          brown: NOTE_COLORS[2],
          yellow: NOTE_COLORS[2],
          orange: NOTE_COLORS[2],
          gold: NOTE_COLORS[2],
          amber: NOTE_COLORS[2],
          tan: NOTE_COLORS[2],
          beige: NOTE_COLORS[2],
          // Green family → Dark Green (#264d3b)
          green: NOTE_COLORS[3],
          lime: NOTE_COLORS[3],
          olive: NOTE_COLORS[3],
          mint: NOTE_COLORS[3],
          forest: NOTE_COLORS[3],
          emerald: NOTE_COLORS[3],
          teal: NOTE_COLORS[3],
          // Blue family → Dark Blue (#256377)
          blue: NOTE_COLORS[4],
          cyan: NOTE_COLORS[4],
          navy: NOTE_COLORS[4],
          sky: NOTE_COLORS[4],
          aqua: NOTE_COLORS[4],
          turquoise: NOTE_COLORS[4],
          // Purple family → Dark Purple (#472f5b)
          purple: NOTE_COLORS[5],
          violet: NOTE_COLORS[5],
          indigo: NOTE_COLORS[5],
          lavender: NOTE_COLORS[5],
          magenta: NOTE_COLORS[5],
          plum: NOTE_COLORS[5],
        };
        const mapped = colorMap[result.color.toLowerCase()];
        if (mapped) setColor(mapped);
      }

      // Match category name to existing categories
      if (result.category) {
        const match = categories.find(
          c => c.name.toLowerCase() === result.category!.toLowerCase()
        );
        if (match) setCategoryId(match.id);
      }

      setVoiceState('idle');
      setTranscription('');
    } catch (error) {
      console.error('Voice parsing error:', error);
      setVoiceState('error');
      setVoiceError('Failed to parse voice command. Please try again.');
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
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
          {/* Type Selector Tabs + Voice Button */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', alignItems: 'center' }}>
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

            {/* Voice Button */}
            {mode === 'create' && (
              <button
                type="button"
                className={`voice-mic-btn ${voiceState === 'listening' ? 'listening' : ''}`}
                onClick={handleVoiceToggle}
                disabled={voiceState === 'processing'}
                title={voiceState === 'listening' ? 'Stop recording' : 'Voice command'}
                style={{ marginLeft: 'auto' }}
              >
                {voiceState === 'processing' ? (
                  <Loader size={18} className="voice-spinner" />
                ) : voiceState === 'listening' ? (
                  <MicOff size={18} />
                ) : (
                  <Mic size={18} />
                )}
              </button>
            )}
          </div>

          {/* Voice Status Area */}
          {voiceState === 'listening' && (
            <div className="voice-status">
              <div className="voice-listening-indicator">
                <span className="voice-dot"></span>
                Listening...
              </div>
              {transcription && (
                <p className="voice-transcription">"{transcription}"</p>
              )}
            </div>
          )}

          {voiceState === 'processing' && (
            <div className="voice-status">
              <div className="voice-processing-indicator">
                <Loader size={16} className="voice-spinner" />
                Processing voice command...
              </div>
            </div>
          )}

          {voiceState === 'error' && (
            <div className="voice-status voice-error">
              <p>{voiceError}</p>
              <button
                type="button"
                onClick={() => { setVoiceState('idle'); setVoiceError(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  padding: '4px 0',
                }}
              >
                Dismiss
              </button>
            </div>
          )}

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
