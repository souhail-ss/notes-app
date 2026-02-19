import { useState, useRef, useEffect } from 'react';
import { Search, Menu, Sun, Moon, X, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

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
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const initials = user ? getInitials(user.name, user.email) : '?';

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

        <div className="user-menu-container" ref={menuRef}>
          <button
            className="user-avatar"
            onClick={() => setMenuOpen(!menuOpen)}
            title={user?.name || user?.email || 'Account'}
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">{initials}</div>
                <div className="user-dropdown-info">
                  {user?.name && <span className="user-dropdown-name">{user.name}</span>}
                  <span className="user-dropdown-email">{user?.email}</span>
                </div>
              </div>

              <div className="user-dropdown-divider"></div>

              <button className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                <User size={16} />
                <span>Profile</span>
              </button>

              <button className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <div className="user-dropdown-divider"></div>

              <button
                className="user-dropdown-item user-dropdown-logout"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
