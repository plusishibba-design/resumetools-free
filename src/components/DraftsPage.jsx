import React, { useState, useEffect } from 'react';
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
    onOpen?.();
  };

  const newBlank = () => {
    const id = createDraft(t('drafts.newName'), DEFAULT_DRAFT_BODY);
    setCurrentDraftId(id);
    onOpen?.();
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
      return new Date(ts).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

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

        {drafts.length === 0 ? (
          <p className="drafts-empty" data-reveal>{t('drafts.empty')}</p>
        ) : (
          <ul className="drafts-list" data-reveal>
            {drafts.map((d) => {
              const body = loadDraft(d.id);
              const personal = body?.resume?.personal || {};
              const role = personal.headline || '';
              const isCurrent = d.id === current;
              return (
                <li key={d.id} className={`draft-card ${isCurrent ? 'is-current' : ''}`}>
                  <div className="draft-card-main">
                    {editingId === d.id ? (
                      <input
                        type="text"
                        className="draft-name-edit"
                        value={editingName}
                        autoFocus
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                        }}
                      />
                    ) : (
                      <h3 className="draft-name" onClick={() => startRename(d)}>
                        {d.name}
                        {isCurrent && <span className="draft-current-badge">{t('drafts.currentBadge')}</span>}
                      </h3>
                    )}
                    <p className="draft-meta">
                      {personal.name && <span>{personal.name}</span>}
                      {personal.name && role && <span className="sep"> · </span>}
                      {role && <span>{role}</span>}
                    </p>
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
