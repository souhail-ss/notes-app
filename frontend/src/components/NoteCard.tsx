import React, { useState, useRef } from 'react';
import { Pin, Trash2, CheckSquare, Palette, Copy } from 'lucide-react';
import { IoCheckmarkCircle } from "react-icons/io5";
import type { Note } from '../types';
import { ListNoteCard } from './ListNoteCard';
import { ColorPicker } from './ColorPicker';

interface NoteCardProps {
  note: Note;
  onPin: (id: number, isPinned: boolean) => void;
  onDelete: (id: number) => void;
  onSelect?: (id: number) => void;
  onColorChange?: (id: number, color: string) => void;
  onDuplicate?: (id: number) => void;
  onToggleItem?: (noteId: number, itemId: string) => void;
  onEdit?: (note: Note) => void;
  isSelected?: boolean;
}

// Utility: Parse CSS variable or hex color to RGB
function parseColor(color: string): [number, number, number] | null {
  // Handle CSS variables by getting computed style
  if (color.startsWith('var(')) {
    const varName = color.match(/var\((--[^)]+)\)/)?.[1];
    if (varName) {
      try {
        const computedColor = getComputedStyle(document.documentElement)
          .getPropertyValue(varName).trim();
        if (!computedColor || computedColor === '') {
          return null;
        }
        return parseColor(computedColor);
      } catch (error) {
        console.warn('Error parsing CSS variable:', varName, error);
        return null;
      }
    }
  }

  // Handle hex colors
  const hex = color.replace('#', '').replace(/\s/g, '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Validate parsed values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }

    return [r, g, b];
  }

  return null;
}

// Utility: Calculate relative luminance (WCAG 2.0)
function getLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 0.5; // Default to medium luminance

  const [r, g, b] = rgb.map(val => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Utility: Get contrasting text color
function getContrastTextColor(backgroundColor: string): string {
  try {
    const luminance = getLuminance(backgroundColor);
    // If background is light (luminance > 0.5), use dark text
    // If background is dark (luminance <= 0.5), use light text
    return luminance > 0.5 ? '#202124' : '#ffffff';
  } catch (error) {
    console.warn('Error calculating text contrast:', backgroundColor, error);
    // Default to white text on error
    return '#ffffff';
  }
}

export function NoteCard({
  note,
  onPin,
  onDelete,
  onSelect,
  onColorChange,
  onDuplicate,
  onToggleItem,
  onEdit,
  isSelected = false
}: NoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  // Predefined text colors for known note colors
  const getTextColorForBackground = (bgColor: string): string => {
    // All our custom colors are dark, so use white text
    const textColorMap: Record<string, string> = {
      '#77172e': '#ffffff',  // Dark Red - white text
      '#7c4a06': '#ffffff',  // Dark Brown - white text
      '#264d3b': '#ffffff',  // Dark Green - white text
      '#256377': '#ffffff',  // Dark Blue - white text
      '#472f5b': '#ffffff',  // Dark Purple - white text
    };

    // Return predefined color or calculate as fallback
    if (textColorMap[bgColor]) {
      return textColorMap[bgColor];
    }

    // Fallback to calculation
    try {
      return getContrastTextColor(bgColor);
    } catch (error) {
      console.warn('Failed to calculate text color, using white text as default');
      return '#ffffff';
    }
  };

  // Handle missing or undefined color - default to transparent
  const noteColor = note.color || 'transparent';
  const isTransparent = noteColor === 'transparent';
  const displayColor = noteColor;
  const textColor = isTransparent ? 'var(--text-primary)' : getTextColorForBackground(displayColor);

  // Unified card style
  const cardStyle = {
    backgroundColor: isTransparent ? 'transparent' : displayColor,
    color: textColor,
  };

  // Log when note is rendered to detect missing fields
  React.useEffect(() => {
    console.log(`[NoteCard] Rendering note ${note.id}:`, {
      id: note.id,
      title: note.title,
      hasContent: note.content !== undefined,
      contentLength: note.content?.length || 0,
      contentPreview: note.content?.substring(0, 30) || '(empty)',
      type: note.type,
      isPinned: note.isPinned,
    });
  }, [note]);

  return (
    <div
      className={`note-card ${isTransparent ? 'transparent' : ''} ${isSelected ? 'selected' : ''}`}
      style={{...cardStyle, cursor: onEdit ? 'pointer' : 'default'}}
      onClick={() => {
        if (onEdit) {
          onEdit(note);
        }
      }}
      aria-label={onEdit ? "Click to edit note" : undefined}
    >
      {/* Top-left: Select button */}
      {onSelect && (
        <button
          className="icon-select icon-select-topleft"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(note.id);
          }}
          title="Select"
          aria-label="Select note"
        >
          <IoCheckmarkCircle size={60} />
        </button>
      )}

      {/* Top-right: Pin button */}
      <button
        className={`icon-pin ${note.isPinned ? 'pinned' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onPin(note.id, !note.isPinned);
        }}
        title={note.isPinned ? 'Unpin' : 'Pin'}
      >
        <Pin size={16} fill={note.isPinned ? 'currentColor' : 'none'} />
      </button>

      {/* Title */}
      <h3 className="note-card-title">{note.title}</h3>

      {/* Content - either text or list */}
      {note.type === 'list' && note.listItems ? (
        onToggleItem ? (
          <ListNoteCard note={note} onToggleItem={onToggleItem} />
        ) : (
          <p className="note-card-content">List note</p>
        )
      ) : (
        <p className="note-card-content">{note.content || ''}</p>
      )}

      {/* Bottom bar with Color, Delete, and Duplicate icons */}
      <div className="note-card-bottom">
        <div className="note-card-bottom-left">
          {onColorChange && (
            <div style={{ position: 'relative' }}>
              <button
                ref={colorButtonRef}
                className="icon-color"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                title="Change color"
              >
                <Palette size={16} />
              </button>

              {showColorPicker && (
                <ColorPicker
                  currentColor={note.color || 'transparent'}
                  onColorSelect={(color) => onColorChange(note.id, color)}
                  onClose={() => setShowColorPicker(false)}
                  anchorRef={colorButtonRef}
                />
              )}
            </div>
          )}
          <button
            className="icon-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
          {onDuplicate && (
            <button
              className="icon-duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(note.id);
              }}
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
          )}
        </div>

        {/* Category badge if present */}
        {note.category && (
          <span className="note-card-category">{note.category.name}</span>
        )}
      </div>
    </div>
  );
}
