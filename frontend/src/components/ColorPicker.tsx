import React, { useEffect, useRef } from 'react';
import { Check, Slash } from 'lucide-react';

// Custom color palette - transparent first (default)
export const NOTE_COLORS = [
  { value: 'transparent', label: 'No color', hex: 'transparent' },
  { value: '#77172e', label: 'Dark Red', hex: '#77172e' },
  { value: '#7c4a06', label: 'Dark Brown', hex: '#7c4a06' },
  { value: '#264d3b', label: 'Dark Green', hex: '#264d3b' },
  { value: '#256377', label: 'Dark Blue', hex: '#256377' },
  { value: '#472f5b', label: 'Dark Purple', hex: '#472f5b' },
];

interface ColorPickerProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function ColorPicker({ currentColor, onColorSelect, onClose, anchorRef }: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleColorClick = (color: string) => {
    onColorSelect(color);
    onClose();
  };

  return (
    <div className="color-picker-inline" ref={pickerRef}>
      {NOTE_COLORS.map((colorOption) => {
        const isSelected = currentColor === colorOption.value;
        const isTransparent = colorOption.value === 'transparent';

        return (
          <button
            key={colorOption.value}
            className={`color-dot ${isSelected ? 'selected' : ''} ${isTransparent ? 'no-color' : ''}`}
            style={{
              backgroundColor: isTransparent ? 'transparent' : colorOption.hex,
            }}
            onClick={() => handleColorClick(colorOption.value)}
            title={colorOption.label}
            aria-label={`${colorOption.label}${isSelected ? ' (selected)' : ''}`}
          >
            {isTransparent ? (
              <Slash size={18} strokeWidth={2} />
            ) : isSelected ? (
              <Check size={16} strokeWidth={3} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
