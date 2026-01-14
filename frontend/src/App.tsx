import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FAB } from './components/FAB';
import { EditNoteModal } from './components/EditNoteModal';
import { NotesGrid } from './components/NotesGrid';
import { notesApi, categoriesApi } from './services/api';
import type { Note, Category, CreateNoteDto, UpdateNoteDto } from './types';
import './index.css';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      console.log('[fetchData] selectedCategory:', selectedCategory);
      if (showArchive) {
        const [archivedData, categoriesData] = await Promise.all([
          notesApi.getArchived(),
          categoriesApi.getAll(),
        ]);
        setArchivedNotes(archivedData);
        setCategories(categoriesData);
      } else {
        const [notesData, categoriesData] = await Promise.all([
          notesApi.getAll(selectedCategory || undefined),
          categoriesApi.getAll(),
        ]);
        console.log('[fetchData] Received notes:', notesData.length, 'notes');
        console.log('[fetchData] Notes categoryIds:', notesData.map(n => ({ id: n.id, title: n.title, categoryId: n.categoryId })));
        setNotes(notesData);
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showArchive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close sidebar when clicking outside on mobile
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Add note
  const handleAddNote = async (noteData: CreateNoteDto) => {
    try {
      const newNote = await notesApi.create(noteData);
      setNotes((prev) => [newNote, ...prev]);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Edit note
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Update note
  const handleUpdateNote = async (id: number, noteData: UpdateNoteDto) => {
    try {
      const updated = await notesApi.update(id, noteData);

      if (showArchive) {
        setArchivedNotes((prev) =>
          prev.map((note) => (note.id === id ? updated : note))
        );
      } else {
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? updated : note))
        );
      }

      setIsModalOpen(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setModalMode('create');
  };

  // Toggle pin
  const handlePin = async (id: number, isPinned: boolean) => {
    console.group(`[App.handlePin] Note ID: ${id}, isPinned: ${isPinned}`);

    try {
      // Log current state
      const currentNote = notes.find(n => n.id === id);
      console.log('[handlePin] Current note:', {
        id: currentNote?.id,
        title: currentNote?.title,
        contentLength: currentNote?.content?.length || 0,
        type: currentNote?.type,
        isPinned: currentNote?.isPinned,
      });

      console.log('[handlePin] Calling API...');
      const updated = await notesApi.update(id, { isPinned });

      console.log('[handlePin] API response:', {
        id: updated.id,
        title: updated.title,
        hasContent: !!updated.content,
        contentLength: updated.content?.length || 0,
        type: updated.type,
        isPinned: updated.isPinned,
      });

      // Validate response
      if (!updated.content && currentNote?.type === 'text') {
        console.error('[handlePin] ⚠️ WARNING: content is missing!');
      }

      if (!updated.type) {
        console.error('[handlePin] ⚠️ WARNING: type is missing!');
      }

      if (!updated.color) {
        console.error('[handlePin] ⚠️ WARNING: color is missing!');
      }

      // Apply defensive fallbacks (keep these until backend fix is confirmed)
      if (!updated.color) {
        console.warn('[handlePin] Applying fallback: color = transparent');
        updated.color = 'transparent';
      }

      if (!updated.type) {
        console.warn('[handlePin] Applying fallback: type = text');
        updated.type = 'text';
      }

      console.log('[handlePin] Updating state...');
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updated : note))
      );

      console.log('[handlePin] ✓ Complete');
    } catch (error) {
      console.error('[handlePin] ✗ Failed:', error);
    } finally {
      console.groupEnd();
    }
  };

  // Delete note
  const handleDelete = async (id: number) => {
    try {
      await notesApi.delete(id);
      if (showArchive) {
        setArchivedNotes((prev) => prev.filter((note) => note.id !== id));
      } else {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Toggle list item
  const handleToggleListItem = async (noteId: number, itemId: string) => {
    try {
      const note = showArchive
        ? archivedNotes.find((n) => n.id === noteId)
        : notes.find((n) => n.id === noteId);

      if (!note || !note.listItems) return;

      const updatedListItems = note.listItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      const updated = await notesApi.update(noteId, { listItems: updatedListItems });

      if (showArchive) {
        setArchivedNotes((prev) =>
          prev.map((n) => (n.id === noteId ? updated : n))
        );
      } else {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? updated : n))
        );
      }
    } catch (error) {
      console.error('Failed to toggle list item:', error);
    }
  };

  // Duplicate note
  const handleDuplicate = async (id: number) => {
    try {
      const duplicated = await notesApi.duplicate(id);
      setNotes((prev) => [duplicated, ...prev]);
    } catch (error) {
      console.error('Failed to duplicate note:', error);
    }
  };

  // Color change - now receives the selected color from ColorPicker
  const handleColorChange = async (id: number, color: string) => {
    try {
      const updated = await notesApi.update(id, { color });
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
    } catch (error) {
      console.error('Failed to change color:', error);
    }
  };

  // Archive/Unarchive note
  const _handleArchive = async (id: number) => {
    try {
      if (showArchive) {
        // Unarchive
        const updated = await notesApi.unarchive(id);
        setArchivedNotes((prev) => prev.filter((note) => note.id !== id));
        setNotes((prev) => [updated, ...prev]);
      } else {
        // Archive
        await notesApi.archive(id);
        setNotes((prev) => prev.filter((note) => note.id !== id));
      }
    } catch (error) {
      console.error('Failed to archive note:', error);
    }
  };

  // Multi-select handlers
  const handleSelectNote = (id: number) => {
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setSelectedNotes([id]);
    } else {
      setSelectedNotes((prev) => {
        const newSelection = prev.includes(id)
          ? prev.filter((noteId) => noteId !== id)
          : [...prev, id];

        // Exit multi-select mode if no notes are selected
        if (newSelection.length === 0) {
          setMultiSelectMode(false);
        }

        return newSelection;
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await notesApi.bulkDelete(selectedNotes);
      if (showArchive) {
        setArchivedNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)));
      } else {
        setNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)));
      }
      setMultiSelectMode(false);
      setSelectedNotes([]);
    } catch (error) {
      console.error('Failed to bulk delete notes:', error);
    }
  };

  const handleBulkArchive = async () => {
    try {
      await notesApi.bulkArchive(selectedNotes);
      setNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)));
      setMultiSelectMode(false);
      setSelectedNotes([]);
    } catch (error) {
      console.error('Failed to bulk archive notes:', error);
    }
  };

  const handleCancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedNotes([]);
  };

  // Reorder note
  const handleReorder = async (noteId: number, newOrder: number, isPinned: boolean) => {
    // Optimistic update - immediately update UI
    const previousNotes = notes;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, order: newOrder } : note
      )
    );

    try {
      // Get all notes in the same section
      const notesInSection = notes
        .filter((n) => n.isPinned === isPinned)
        .map((n) => (n.id === noteId ? { ...n, order: newOrder } : n))
        .sort((a, b) => a.order - b.order);

      // Reindex to prevent fractional accumulation (0, 1, 2, 3...)
      const reindexedNotes = notesInSection.map((note, index) => ({
        id: note.id,
        order: index,
      }));

      // Call backend API
      await notesApi.reorder(reindexedNotes);

      // Update state with clean indexes
      setNotes((prev) =>
        prev.map((note) => {
          const reindexed = reindexedNotes.find((r) => r.id === note.id);
          return reindexed ? { ...note, order: reindexed.order } : note;
        })
      );
    } catch (error) {
      console.error('Failed to reorder note:', error);
      // Rollback on error
      setNotes(previousNotes);
    }
  };

  // Filter notes
  const displayNotes = showArchive ? archivedNotes : notes;
  const filteredNotes = displayNotes.filter((note) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const contentMatch = note.content?.toLowerCase().includes(query) || false;
      const listItemsMatch = note.listItems?.some(item =>
        item.text.toLowerCase().includes(query)
      ) || false;

      if (
        !note.title.toLowerCase().includes(query) &&
        !contentMatch &&
        !listItemsMatch
      ) {
        return false;
      }
    }

    // Pinned filter
    if (showPinned && !note.isPinned) {
      return false;
    }

    return true;
  });

  const handleSelectCategory = (categoryId: number | null) => {
    console.log('[handleSelectCategory] Setting category to:', categoryId);
    setSelectedCategory(categoryId);
    setShowPinned(false);
    setShowArchive(false);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleTogglePinned = () => {
    setShowPinned(!showPinned);
    setSelectedCategory(null);
    setShowArchive(false);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleToggleArchive = () => {
    setShowArchive(!showArchive);
    setSelectedCategory(null);
    setShowPinned(false);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  if (loading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          width: '100%'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={handleCloseSidebar}
      />
      
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        showPinned={showPinned}
        onTogglePinned={handleTogglePinned}
        showArchive={showArchive}
        onToggleArchive={handleToggleArchive}
        isOpen={sidebarOpen}
      />
      
      <main className="main-content">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="content-area">
          {/* Multi-select toolbar */}
          {multiSelectMode && (
            <div style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--border-radius)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
            }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {selectedNotes.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                style={{
                  padding: '8px 16px',
                  background: 'var(--error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Delete
              </button>
              {!showArchive && (
                <button
                  onClick={handleBulkArchive}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  Archive
                </button>
              )}
              <button
                onClick={handleCancelMultiSelect}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <NotesGrid
            notes={filteredNotes}
            onPin={handlePin}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onSelect={handleSelectNote}
            onColorChange={handleColorChange}
            onDuplicate={handleDuplicate}
            onToggleItem={handleToggleListItem}
            onEdit={handleEditNote}
            selectedNotes={selectedNotes}
          />
        </div>
      </main>

      <FAB onClick={() => {
        setModalMode('create');
        setEditingNote(null);
        setIsModalOpen(true);
      }} />

      <EditNoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        onAdd={handleAddNote}
        onEdit={handleUpdateNote}
        mode={modalMode}
        initialNote={editingNote || undefined}
      />
    </div>
  );
}

export default App;
