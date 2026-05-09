import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import {
  listDrafts,
  loadDraft,
  createDraft,
  duplicateDraft,
  deleteDraft,
  renameDraft,
  setCurrentDraftId,
  getCurrentDraftId,
} from '../lib/draftsStore';
import { DEFAULT_DRAFT_BODY } from '../lib/defaultResume';
import { LETTER_TYPE_META } from '../lib/defaultLetters';

// Determine the route slug for opening a draft based on its type
function routeForDraft(body) {
  if (!body) return 'resume';
  if (body.type === 'letter' && body.letterType) return body.letterType;
  return 'resume'; // default + legacy
}

// Display label for the draft type
function typeLabelKey(body) {
  if (!body) return 'home.tool.resume.name';
  if (body.type === 'letter' && body.letterType && LETTER_TYPE_META[body.letterType]) {
    return LETTER_TYPE_META[body.letterType].nameKey;
  }
  return 'home.tool.resume.name';
}

function typeIcon(body) {
  if (body?.type === 'letter' && body.letterType && LETTER_TYPE_META[body.letterType]) {
    return LETTER_TYPE_META[body.letterType].icon;
  }
  return '☷';
}

function DraftsPage({ onOpen }) {
  const { t, lang } = useLanguage();
  const [drafts, setDrafts] = useState(() => listDrafts());
  const [current, setCurrent] = useState(() => getCurrentDraftId());
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const refresh = () => {
    setDrafts(listDrafts());
    setCurrent(getCurrentDraftId());
  };

  const openDraft = (id) => {
    setCurrentDraftId(id);
    const body = loadDraft(id);
    onOpen?.(routeForDraft(body));
  };

  const newBlank = () => {
    const id = createDraft(t('drafts.newName'), { type: 'resume', ...DEFAULT_DRAFT_BODY });
    setCurrentDraftId(id);
    onOpen?.('resume');
  };

  const duplicate = (id) => {
    duplicateDraft(id);
    refresh();
  };

  const startRename = (d) => {
    setEditingId(d.id);
    setEditingName(d.name);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) {
      renameDraft(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
    refresh();
  };

  const doDelete = (id) => {
    deleteDraft(id);
    setConfirmDelete(null);
    refresh();
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const locale = lang === 'ja' ? 'ja-JP' : lang === 'vi' ? 'vi-VN' : lang === 'zh' ? 'zh-CN' : lang === 'id' ? 'id-ID' : 'en-US';
      return new Date(ts).toLocaleString(locale, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

  // Sort by updatedAt desc
  const sorted = [...drafts].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <div className="editorial-page">
      <div className="editorial-page-inner">
        <p className="meta-stamp" style={{ marginBottom: '1rem' }} data-reveal>
          <span>STUDIO T. ISHI</span>
          <span className="sep">·</span>
          <span>DRAFTS</span>
        </p>
        <h1 className="editorial-title" data-reveal>
          {t('drafts.titleSerif')}
          <br />
          <em>{t('drafts.titleEm')}</em>
        </h1>
        <p className="editorial-lede" data-reveal>{t('drafts.lede')}</p>

        <div className="drafts-actions" data-reveal>
          <button type="button" className="cta-primary" onClick={newBlank}>
            {t('drafts.newBtn')}
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="drafts-empty" data-reveal>{t('drafts.empty')}</p>
        ) : (
          <ul className="drafts-list" data-reveal>
            {sorted.map((d) => {
              const body = loadDraft(d.id);
              const isLetter = body?.type === 'letter';
              const personal = body?.resume?.personal || {};
              const sender = body?.letter?.sender || {};
              const isCurrent = d.id === current;
              const subtitle = isLetter
                ? (sender.name || '')
                : ((personal.name || '') + (personal.headline ? ' · ' + personal.headline : ''));
              return (
                <li key={d.id} className={`draft-card ${isCurrent ? 'is-current' : ''}`}>
                  <div className="draft-card-main">
                    {editingId === d.id ? (
                      <input type="text" className="draft-name-edit"
                        value={editingName} autoFocus
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                        }} />
                    ) : (
                      <h3 className="draft-name" onClick={() => startRename(d)}>
                        {d.name}
                        {isCurrent && <span className="draft-current-badge">{t('drafts.currentBadge')}</span>}
                      </h3>
                    )}
                    <p className="draft-type">
                      <span className="draft-type-icon">{typeIcon(body)}</span>
                      <span className="draft-type-name">{t(typeLabelKey(body))}</span>
                    </p>
                    {subtitle && <p className="draft-meta">{subtitle}</p>}
                    <p className="draft-updated">
                      {t('drafts.updated')}: {formatTime(d.updatedAt)}
                    </p>
                  </div>
                  <div className="draft-card-actions">
                    <button type="button" className="cta-primary" onClick={() => openDraft(d.id)}>
                      {t('drafts.openBtn')}
                    </button>
                    <button type="button" className="cta-ghost" onClick={() => duplicate(d.id)}>
                      {t('drafts.duplicateBtn')}
                    </button>
                    <button type="button" className="cta-ghost danger"
                      onClick={() => setConfirmDelete(d.id)}>
                      {t('drafts.deleteBtn')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3>{t('drafts.deleteTitle')}</h3>
            <p>{t('drafts.deleteBody')}</p>
            <div className="modal-actions">
              <button type="button" className="cta-ghost" onClick={() => setConfirmDelete(null)}>
                {t('builder.cancelBtn')}
              </button>
              <button type="button" className="cta-primary danger" onClick={() => doDelete(confirmDelete)}>
                {t('drafts.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DraftsPage;
