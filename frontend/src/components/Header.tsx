import { Search, Menu, Sun, Moon, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ 
  searchQuery, 
  onSearchChange, 
  onMenuClick,
  theme,
  onToggleTheme 
}: HeaderProps) {
  // Mock user for now
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'JD'
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search your notes..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        <button
          className="icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="user-avatar" title={user.name}>
          {user.avatar}
        </div>
      </div>
    </header>
  );
}
