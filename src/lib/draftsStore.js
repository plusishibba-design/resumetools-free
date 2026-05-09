// Drafts store — manage multiple resume drafts in localStorage.
//
// Schema:
//   resumetools-drafts-index    → [{ id, name, updatedAt }, ...]
//   resumetools-current-draft   → 'id-of-current'
//   resumetools-draft-{id}      → { resume, template, pageSize }

const INDEX_KEY = 'resumetools-drafts-index';
const CURRENT_KEY = 'resumetools-current-draft';
const DRAFT_PREFIX = 'resumetools-draft-';
const LEGACY_KEYS = {
  resume: 'resumetools-data-v2',
  resumeOld: 'resumetools-data-v1',
  template: 'resumetools-template-v1',
  pageSize: 'resumetools-pagesize-v1',
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function safeJSONParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function listDrafts() {
  return safeJSONParse(localStorage.getItem(INDEX_KEY), []);
}

export function getCurrentDraftId() {
  return localStorage.getItem(CURRENT_KEY) || null;
}

export function setCurrentDraftId(id) {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
}

export function loadDraft(id) {
  const raw = localStorage.getItem(DRAFT_PREFIX + id);
  if (!raw) return null;
  return safeJSONParse(raw, null);
}

export function saveDraft(id, draft) {
  localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(draft));
  // Touch index updatedAt
  const idx = listDrafts().map((d) => (d.id === id ? { ...d, updatedAt: Date.now() } : d));
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

export function createDraft(name, draftBody) {
  const id = uid();
  const idx = listDrafts();
  idx.push({ id, name, updatedAt: Date.now() });
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(draftBody));
  return id;
}

export function renameDraft(id, name) {
  const idx = listDrafts().map((d) => (d.id === id ? { ...d, name } : d));
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

export function duplicateDraft(id) {
  const original = loadDraft(id);
  if (!original) return null;
  const meta = listDrafts().find((d) => d.id === id);
  const newName = `${meta?.name || 'Untitled'} (copy)`;
  return createDraft(newName, original);
}

export function deleteDraft(id) {
  const idx = listDrafts().filter((d) => d.id !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  localStorage.removeItem(DRAFT_PREFIX + id);
  if (getCurrentDraftId() === id) {
    setCurrentDraftId(null);
  }
}

// One-time migration from v0.2 single-resume schema to v0.3 multi-draft.
// Returns the id of the migrated draft, or null if nothing to migrate.
export function migrateLegacyIfNeeded(defaultDraftBody) {
  // Already migrated?
  if (listDrafts().length > 0) return null;

  const legacyResume =
    localStorage.getItem(LEGACY_KEYS.resume) ||
    localStorage.getItem(LEGACY_KEYS.resumeOld);

  // No legacy + no drafts: bootstrap with the supplied default body
  if (!legacyResume) {
    const id = createDraft('Untitled', defaultDraftBody);
    setCurrentDraftId(id);
    return id;
  }

  const resume = safeJSONParse(legacyResume, null);
  const template = localStorage.getItem(LEGACY_KEYS.template) || 'classic';
  const pageSize = localStorage.getItem(LEGACY_KEYS.pageSize) || 'a4';

  if (!resume) {
    const id = createDraft('Untitled', defaultDraftBody);
    setCurrentDraftId(id);
    return id;
  }

  const id = createDraft('Untitled', { resume, template, pageSize });
  setCurrentDraftId(id);
  // Don't delete legacy keys — leave for safety
  return id;
}

// Helper: get currently active draft, or create+set first one
export function getOrCreateCurrentDraft(defaultDraftBody) {
  let id = getCurrentDraftId();
  if (id && loadDraft(id)) return { id, draft: loadDraft(id) };

  // No current; pick first or create
  const drafts = listDrafts();
  if (drafts.length > 0) {
    id = drafts[0].id;
    setCurrentDraftId(id);
    return { id, draft: loadDraft(id) };
  }
  id = createDraft('Untitled', defaultDraftBody);
  setCurrentDraftId(id);
  return { id, draft: defaultDraftBody };
}
