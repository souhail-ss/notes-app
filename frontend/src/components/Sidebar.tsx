import {
  StickyNote,
  Pin,
  Archive,
  User,
  Briefcase,
  Lightbulb,
  Target,
  Utensils
} from 'lucide-react';
import type { Category } from '../types';

interface SidebarProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  showPinned: boolean;
  onTogglePinned: () => void;
  showArchive: boolean;
  onToggleArchive: () => void;
  isOpen?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  user: User,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
  target: Target,
  utensils: Utensils,
  folder: StickyNote,
};

export function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  showPinned,
  onTogglePinned,
  showArchive,
  onToggleArchive,
  isOpen = false
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">📝</span>
        <span className="sidebar-logo-text">MyNotes</span>
      </div>
      
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${!selectedCategory && !showPinned ? 'active' : ''}`}
          onClick={() => { onSelectCategory(null); }}
        >
          <StickyNote size={20} className="nav-item-icon" />
          All Notes
        </button>
        
        <button
          className={`nav-item ${showPinned ? 'active' : ''}`}
          onClick={onTogglePinned}
        >
          <Pin size={20} className="nav-item-icon" />
          Pinned
        </button>

        <button
          className={`nav-item ${showArchive ? 'active' : ''}`}
          onClick={onToggleArchive}
        >
          <Archive size={20} className="nav-item-icon" />
          Archive
        </button>

        <div className="nav-divider" />

        {categories.length > 0 && (
          <>
            <div className="categories-header">Categories</div>
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon] || StickyNote;
              return (
                <button
                  key={category.id}
                  className={`nav-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <IconComponent size={20} />
                  {category.name}
                </button>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
