// Shared profile derivation — when the user creates a new letter, prefill the
// sender block from any existing draft that already has personal info.
//
// Strategy: walk through all drafts (most recently updated first), look for
// resume.personal or letter.sender content, and return the first match.

import { listDrafts, loadDraft } from './draftsStore';

const EMPTY = { name: '', email: '', phone: '', address: '' };

function senderFromResume(personal) {
  if (!personal || !personal.name) return null;
  return {
    name: personal.name || '',
    email: personal.email || '',
    phone: personal.phone || '',
    address: personal.location || '',
  };
}

function senderFromLetter(sender) {
  if (!sender || !sender.name) return null;
  return {
    name: sender.name || '',
    email: sender.email || '',
    phone: sender.phone || '',
    address: sender.address || '',
  };
}

export function getMostRecentSender() {
  const drafts = [...listDrafts()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  for (const meta of drafts) {
    const draft = loadDraft(meta.id);
    if (!draft) continue;
    const fromResume = senderFromResume(draft.resume?.personal);
    if (fromResume) return fromResume;
    const fromLetter = senderFromLetter(draft.letter?.sender);
    if (fromLetter) return fromLetter;
  }
  return EMPTY;
}
