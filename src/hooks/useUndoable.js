import { useState, useCallback, useRef } from 'react';

const HISTORY_LIMIT = 30;
const COMMIT_DEBOUNCE_MS = 800;

// useUndoable: state hook with undo/redo backed by a bounded history stack.
// Commits to history are debounced so rapid keystrokes don't fill the stack.
export default function useUndoable(initial) {
  const [state, setStateRaw] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);
  const timeoutRef = useRef(null);
  const lastCommittedRef = useRef(initial);

  const commit = useCallback((newState) => {
    if (newState === lastCommittedRef.current) return;
    past.current.push(lastCommittedRef.current);
    if (past.current.length > HISTORY_LIMIT) {
      past.current.shift();
    }
    future.current = [];
    lastCommittedRef.current = newState;
  }, []);

  const setState = useCallback((updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Debounced commit
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => commit(next), COMMIT_DEBOUNCE_MS);
      return next;
    });
  }, [commit]);

  const undo = useCallback(() => {
    // Force commit any pending change first
    clearTimeout(timeoutRef.current);
    if (state !== lastCommittedRef.current) commit(state);

    if (past.current.length === 0) return;
    const prev = past.current.pop();
    future.current.push(lastCommittedRef.current);
    lastCommittedRef.current = prev;
    setStateRaw(prev);
  }, [state, commit]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop();
    past.current.push(lastCommittedRef.current);
    lastCommittedRef.current = next;
    setStateRaw(next);
  }, []);

  // Replace state without committing to history (useful for loading drafts)
  const replace = useCallback((next) => {
    clearTimeout(timeoutRef.current);
    past.current = [];
    future.current = [];
    lastCommittedRef.current = next;
    setStateRaw(next);
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    replace,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
