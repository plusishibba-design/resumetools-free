import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import LetterDocument from './LetterDocument';
import useUndoable from '../hooks/useUndoable';
import {
  getOrCreateCurrentDraft,
  saveDraft,
  getCurrentDraftId,
  listDrafts,
  renameDraft,
  createDraft,
  setCurrentDraftId,
} from '../lib/draftsStore';
import { LETTER_TYPE_META, buildDefaultLetter } from '../lib/defaultLetters';
import { getMostRecentSender } from '../lib/sharedProfile';

// Generic builder for a single letter type. The letterType prop selects
// the typography, default content, and i18n labels.
function LetterBuilder({ letterType }) {
  const { t, lang } = useLanguage();
  const meta = LETTER_TYPE_META[letterType];
  if (!meta) throw new Error(`Unknown letter type: ${letterType}`);

  // === Initial draft loading ===
  const initRef = useRef(null);
  if (initRef.current === null) {
    let draftBody = null;
    let draftId = null;
    try {
      // If the current draft matches this letter type, use it. Otherwise
      // create a fresh one (prefilled from the most recent sender we can find).
      const currentId = getCurrentDraftId();
      if (currentId) {
        const current = getOrCreateCurrentDraft(buildDefaultLetter(letterType, getMostRecentSender()));
        if (current.draft?.letterType === letterType) {
          draftId = current.id;
          draftBody = current.draft;
        }
      }
      if (!draftId) {
        // Create new draft of this type
        const sender = getMostRecentSender();
        const body = buildDefaultLetter(letterType, sender);
        const name = t(meta.nameKey);
        draftId = createDraft(name, body);
        setCurrentDraftId(draftId);
        draftBody = body;
      }
    } catch (e) {
      console.warn('Letter draft init error:', e);
      draftBody = buildDefaultLetter(letterType);
      draftId = 'fallback';
    }
    initRef.current = {
      id: draftId,
      letter: draftBody.letter,
      template: draftBody.template || 'formal',
      pageSize: draftBody.pageSize || 'a4',
    };
  }
  const initial = initRef.current;

  const [draftId, setDraftId] = useState(initial.id);
  const undoable = useUndoable(initial.letter);
  const letter = undoable.state;
  const [template, setTemplate] = useState(initial.template);
  const [pageSize, setPageSize] = useState(initial.pageSize);
  const [pageCount, setPageCount] = useState(1);
  const [showResetModal, setShowResetModal] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [draftName, setDraftName] = useState(() => {
    const m = listDrafts().find((d) => d.id === draftId);
    return m?.name || t(meta.nameKey);
  });
  const [editingName, setEditingName] = useState(false);

  // Persist on every change
  useEffect(() => {
    saveDraft(draftId, {
      type: 'letter',
      letterType,
      letter,
      template,
      pageSize,
    });
  }, [letter, template, pageSize, draftId, letterType]);

  // @page rule for the chosen size
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'letter-page-rule';
    styleEl.textContent = `@page { size: ${pageSize === 'letter' ? 'letter' : 'A4'}; margin: 0; }`;
    document.head.appendChild(styleEl);
    return () => {
      const existing = document.getElementById('letter-page-rule');
      if (existing) existing.remove();
    };
  }, [pageSize]);

  // Undo/redo keyboard
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

  const handlePageCount = useCallback((n) => setPageCount(n), []);
  const setLetter = undoable.setState;
  const updateField = (key, value) => setLetter((l) => ({ ...l, [key]: value }));
  const updateNested = (group, key, value) =>
    setLetter((l) => ({ ...l, [group]: { ...l[group], [key]: value } }));

  const reset = () => {
    undoable.replace(buildDefaultLetter(letterType, getMostRecentSender()).letter);
    setShowResetModal(false);
  };

  const print = () => window.print();

  const safeFilenameStem = () =>
    (draftName || letterType).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || letterType;

  const exportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const { exportToPdf } = await import('../lib/exportPdf');
      const element = document.querySelector('.letter-doc');
      await exportToPdf({
        element,
        filename: `${safeFilenameStem()}.pdf`,
        pageSize,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(t('builder.pdfFailed'));
    } finally {
      setExportingPdf(false);
    }
  };

  const exportDocx = async () => {
    if (exportingDocx) return;
    setExportingDocx(true);
    try {
      const { exportLetterToDocx } = await import('../lib/exportLetterDocx');
      await exportLetterToDocx(letter, lang, `${safeFilenameStem()}.docx`);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(t('builder.docxFailed'));
    } finally {
      setExportingDocx(false);
    }
  };

  const commitDraftName = () => {
    if (draftName.trim()) renameDraft(draftId, draftName.trim());
    setEditingName(false);
  };

  return (
    <div className="builder-layout">
      {/* LEFT: form panel */}
      <div className="builder-form no-print" data-reveal>
        <div className="builder-draft-row">
          {editingName ? (
            <input type="text" className="draft-name-edit"
              value={draftName} autoFocus
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitDraftName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDraftName();
                if (e.key === 'Escape') setEditingName(false);
              }} />
          ) : (
            <h2 className="draft-name-display"
              onClick={() => setEditingName(true)}
              title={t('builder.renameHint')}>
              {draftName}
              <span className="rename-icon" aria-hidden="true">✎</span>
            </h2>
          )}
          <p className="draft-type-label">
            <span className="ux-toggle-icon">{meta.icon}</span>
            {' '}
            {t(meta.titleKey)}
          </p>
        </div>

        <div className="builder-toolbar">
          <div className="builder-template-picker">
            <span className="picker-label">{t('builder.templateLabel')}</span>
            <div className="picker-buttons">
              {['formal', 'modern', 'minimal'].map((tmpl) => (
                <button key={tmpl} type="button"
                  className={`picker-btn ${template === tmpl ? 'is-active' : ''}`}
                  onClick={() => setTemplate(tmpl)}>
                  {t(`letter.template.${tmpl}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="builder-template-picker">
            <span className="picker-label">{t('builder.pageSizeLabel')}</span>
            <div className="picker-buttons">
              {['a4', 'letter'].map((size) => (
                <button key={size} type="button"
                  className={`picker-btn ${pageSize === size ? 'is-active' : ''}`}
                  onClick={() => setPageSize(size)}>
                  {t(`builder.pageSize${size === 'a4' ? 'A4' : 'Letter'}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="builder-actions">
            <button type="button" className="cta-ghost" onClick={undoable.undo} disabled={!undoable.canUndo}>
              ↶ {t('builder.undoBtn')}
            </button>
            <button type="button" className="cta-ghost" onClick={undoable.redo} disabled={!undoable.canRedo}>
              ↷ {t('builder.redoBtn')}
            </button>
            <button type="button" className="cta-ghost" onClick={() => setShowResetModal(true)}>
              {t('builder.resetBtn')}
            </button>
            <button type="button" className="cta-ghost" onClick={print}>
              {t('builder.printBtn')}
            </button>
            <button type="button" className="cta-ghost" onClick={exportDocx} disabled={exportingDocx}>
              {exportingDocx ? t('builder.exportingDocx') : t('builder.docxBtn')}
            </button>
            <button type="button" className="cta-ghost" onClick={exportPdf} disabled={exportingPdf}>
              {exportingPdf ? t('builder.exportingPdf') : t('builder.pdfBtn')}
            </button>
          </div>
        </div>

        <div className="builder-meta-row">
          <p className="saved-note">{t('builder.savedNote')}</p>
          <p className={`page-count-note ${pageCount > 1 ? 'is-overflow' : ''}`}>
            {pageCount === 1
              ? t('builder.pageCountSingle')
              : t('builder.pageCountMulti').replace('{0}', String(pageCount))}
          </p>
        </div>

        {/* Sender */}
        <fieldset className="builder-fieldset">
          <legend>{t('letter.sectionSender')}</legend>
          <div className="grid-2">
            <Field label={t('letter.fieldSenderName')} value={letter.sender.name}
              onChange={(v) => updateNested('sender', 'name', v)} />
            <Field label={t('letter.fieldSenderEmail')} value={letter.sender.email}
              onChange={(v) => updateNested('sender', 'email', v)} type="email" />
            <Field label={t('letter.fieldSenderPhone')} value={letter.sender.phone}
              onChange={(v) => updateNested('sender', 'phone', v)} />
            <Field label={t('letter.fieldSenderAddress')} value={letter.sender.address}
              onChange={(v) => updateNested('sender', 'address', v)} />
          </div>
        </fieldset>

        {/* Recipient */}
        <fieldset className="builder-fieldset">
          <legend>{t('letter.sectionRecipient')}</legend>
          <div className="grid-2">
            <Field label={t('letter.fieldRecipientName')} value={letter.recipient.name}
              onChange={(v) => updateNested('recipient', 'name', v)} />
            <Field label={t('letter.fieldRecipientTitle')} value={letter.recipient.title}
              onChange={(v) => updateNested('recipient', 'title', v)} />
            <Field label={t('letter.fieldRecipientCompany')} value={letter.recipient.company}
              onChange={(v) => updateNested('recipient', 'company', v)} />
            <Field label={t('letter.fieldRecipientAddress')} value={letter.recipient.address}
              onChange={(v) => updateNested('recipient', 'address', v)} />
          </div>
        </fieldset>

        {/* Date + Subject */}
        <fieldset className="builder-fieldset">
          <legend>{t('letter.sectionMeta')}</legend>
          <div className="grid-2">
            <div className="builder-field">
              <label>{t('letter.fieldDate')}</label>
              <input type="date" value={letter.date || ''}
                onChange={(e) => updateField('date', e.target.value)} />
            </div>
            <Field label={t('letter.fieldSubject')} value={letter.subject}
              onChange={(v) => updateField('subject', v)} />
          </div>
        </fieldset>

        {/* Greeting + Body + Closing */}
        <fieldset className="builder-fieldset">
          <legend>{t('letter.sectionContent')}</legend>
          <Field label={t('letter.fieldGreeting')} value={letter.greeting}
            onChange={(v) => updateField('greeting', v)} />
          <Field label={t('letter.fieldBody')} value={letter.body}
            onChange={(v) => updateField('body', v)} multiline rows={12}
            hint={t('letter.bodyHint')} />
          <div className="grid-2">
            <Field label={t('letter.fieldClosing')} value={letter.closing}
              onChange={(v) => updateField('closing', v)} />
            <Field label={t('letter.fieldSignature')} value={letter.signature}
              onChange={(v) => updateField('signature', v)} />
          </div>
        </fieldset>
      </div>

      {/* RIGHT: live preview */}
      <div className="builder-preview-wrap">
        <div className="builder-preview-inner" data-page-count={pageCount}>
          <LetterDocument letter={letter} template={template} pageSize={pageSize}
            lang={lang} onPageCount={handlePageCount} />
        </div>
      </div>

      {showResetModal && (
        <div className="modal-backdrop no-print"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3>{t('builder.resetModalTitle')}</h3>
            <p>{t('builder.resetModalBody')}</p>
            <div className="modal-actions">
              <button type="button" className="cta-ghost" onClick={() => setShowResetModal(false)}>
                {t('builder.cancelBtn')}
              </button>
              <button type="button" className="cta-primary" onClick={reset}>
                {t('builder.confirmResetBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, multiline, rows = 2, type = 'text', hint }) {
  return (
    <div className="builder-field">
      <label>{label}</label>
      {multiline ? (
        <textarea value={value || ''} rows={rows}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value || ''}
          onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export default LetterBuilder;
