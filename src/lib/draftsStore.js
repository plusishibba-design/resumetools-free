// Drafts store — manage multiple career-document drafts in localStorage.
//
// Schema (v0.4 / careertools):
//   careertools-drafts-index    → [{ id, name, updatedAt }, ...]
//   careertools-current-draft   → 'id-of-current'
//   careertools-draft-{id}      → { resume, template, pageSize }
//
// Backward-compatible read of v0.3 / resumetools-* keys is performed once at
// load via migrateFromResumeTools().

const INDEX_KEY = 'careertools-drafts-index';
const CURRENT_KEY = 'careertools-current-draft';
const DRAFT_PREFIX = 'careertools-draft-';

const RESUMETOOLS_INDEX_KEY = 'resumetools-drafts-index';
const RESUMETOOLS_CURRENT_KEY = 'resumetools-current-draft';
const RESUMETOOLS_DRAFT_PREFIX = 'resumetools-draft-';

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
  // localStorage.getItem returns null for missing keys.
  // JSON.parse(null) returns null (not an error), so we have to guard.
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function listDrafts() {
  const result = safeJSONParse(localStorage.getItem(INDEX_KEY), []);
  return Array.isArray(result) ? result : [];
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

// Migrate from resumetools-* keys (v0.3) to careertools-* keys (v0.4).
// Runs once: if careertools-drafts-index already populated, nothing to do.
function migrateFromResumeTools() {
  if (listDrafts().length > 0) return; // already migrated

  const oldIndex = localStorage.getItem(RESUMETOOLS_INDEX_KEY);
  if (!oldIndex) return; // no resumetools data either

  // Copy index
  localStorage.setItem(INDEX_KEY, oldIndex);

  // Copy current pointer
  const oldCurrent = localStorage.getItem(RESUMETOOLS_CURRENT_KEY);
  if (oldCurrent) localStorage.setItem(CURRENT_KEY, oldCurrent);

  // Copy each draft body
  try {
    const drafts = JSON.parse(oldIndex);
    if (Array.isArray(drafts)) {
      drafts.forEach((d) => {
        if (!d?.id) return;
        const oldKey = RESUMETOOLS_DRAFT_PREFIX + d.id;
        const newKey = DRAFT_PREFIX + d.id;
        const data = localStorage.getItem(oldKey);
        if (data) localStorage.setItem(newKey, data);
      });
    }
  } catch (e) {
    console.warn('Resume → Career drafts migration error:', e);
  }
  // Don't delete old keys yet — leave for safety, can be cleaned up later
}

// Migrate from v0.2 single-resume schema (resumetools-data-v2) — used only if
// migrateFromResumeTools didn't recover any drafts.
export function migrateLegacyIfNeeded(defaultDraftBody) {
  // Run resumetools→careertools migration first
  migrateFromResumeTools();

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
