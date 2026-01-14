import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      className="fab"
      onClick={onClick}
      aria-label="Add note"
      title="Add note"
    >
      <Plus size={24} />
    </button>
  );
}
