import { useEffect } from 'react';

// Wires Ctrl/Cmd + Z and Ctrl/Cmd + Y / Shift+Z to an undoable's undo/redo.
export default function useUndoableShortcuts(undoable) {
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoable.undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        undoable.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undoable]);
}
