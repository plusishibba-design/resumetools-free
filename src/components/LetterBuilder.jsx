import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import LetterDocument from './document/LetterDocument';
import BuilderToolbar from './builder/BuilderToolbar';
import ResetModal from './builder/ResetModal';
import DraftNameRow from './builder/DraftNameRow';
import { Field, FieldSet, DateField } from './builder/FormFields';
import useUndoable from '../hooks/useUndoable';
import useUndoableShortcuts from '../hooks/useUndoableShortcuts';
import {
  getOrCreateCurrentDraft,
  saveDraft,
  getCurrentDraftId,
  listDrafts,
  renameDraft,
  createDraft,
  setCurrentDraftId,
} from '../lib/drafts/draftsStore';
import { LETTER_TYPE_META, buildDefaultLetter } from '../lib/drafts/defaultLetters';
import { getMostRecentSender } from '../lib/drafts/sharedProfile';
import { DEFAULT_ACCENT_ID, getAccent, accentVars } from '../lib/analysis/accentColors';
import { ResumeNarrator, buildLetterNarration } from '../lib/analysis/readAloud';

function LetterBuilder({ letterType }) {
  const { t, lang } = useLanguage();
  const meta = LETTER_TYPE_META[letterType];
  if (!meta) throw new Error(`Unknown letter type: ${letterType}`);

  const initRef = useRef(null);
  if (initRef.current === null) {
    let draftBody = null;
    let dId = null;
    try {
      const currentId = getCurrentDraftId();
      if (currentId) {
        const current = getOrCreateCurrentDraft(buildDefaultLetter(letterType, getMostRecentSender()));
        if (current.draft?.letterType === letterType) {
          dId = current.id;
          draftBody = current.draft;
        }
      }
      if (!dId) {
        const sender = getMostRecentSender();
        const body = buildDefaultLetter(letterType, sender);
        const name = t(meta.nameKey);
        dId = createDraft(name, body);
        setCurrentDraftId(dId);
        draftBody = body;
      }
    } catch (e) {
      console.warn('Letter draft init error:', e);
      draftBody = buildDefaultLetter(letterType);
      dId = 'fallback';
    }
    initRef.current = {
      id: dId,
      letter: draftBody.letter,
      template: draftBody.template || 'formal',
      pageSize: draftBody.pageSize || 'a4',
      accentColor: draftBody.accentColor || DEFAULT_ACCENT_ID,
    };
  }
  const initial = initRef.current;

  const [draftId] = useState(initial.id);
  const undoable = useUndoable(initial.letter);
  const letter = undoable.state;
  const [template, setTemplate] = useState(initial.template);
  const [pageSize, setPageSize] = useState(initial.pageSize);
  const [accentId, setAccentId] = useState(initial.accentColor);
  const accent = getAccent(accentId);
  const [pageCount, setPageCount] = useState(1);
  const [showResetModal, setShowResetModal] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sixSecondView, setSixSecondView] = useState(false);
  const [readingAloud, setReadingAloud] = useState(false);
  const narratorRef = useRef(null);

  const [draftName, setDraftName] = useState(() => {
    const m = listDrafts().find((d) => d.id === draftId);
    return m?.name || t(meta.nameKey);
  });

  useEffect(() => {
    saveDraft(draftId, {
      type: 'letter',
      letterType,
      letter,
      template,
      pageSize,
      accentColor: accentId,
    });
  }, [letter, template, pageSize, accentId, draftId, letterType]);

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

  useUndoableShortcuts(undoable);

  useEffect(() => {
    narratorRef.current = new ResumeNarrator(lang);
    narratorRef.current.setOnEnd(() => setReadingAloud(false));
    return () => narratorRef.current?.stop();
  }, [lang]);

  const toggleReadAloud = () => {
    const n = narratorRef.current;
    if (!n || !n.isSupported()) {
      alert(t('builder.readAloudUnsupported'));
      return;
    }
    if (readingAloud) {
      n.stop();
      setReadingAloud(false);
    } else {
      n.speak(buildLetterNarration(letter));
      setReadingAloud(true);
    }
  };

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
      const { exportToPdf } = await import('../lib/exporters/exportPdf');
      const element = document.querySelector('.letter-doc');
      await exportToPdf({ element, filename: `${safeFilenameStem()}.pdf`, pageSize });
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
      const { exportLetterToDocx } = await import('../lib/exporters/exportLetterDocx');
      await exportLetterToDocx(letter, lang, `${safeFilenameStem()}.docx`);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(t('builder.docxFailed'));
    } finally {
      setExportingDocx(false);
    }
  };

  const onDraftNameChange = (newName) => {
    setDraftName(newName);
    renameDraft(draftId, newName);
  };

  return (
    <div className="builder-layout">
      <div className="builder-form no-print" data-reveal>
        <DraftNameRow name={draftName} onChange={onDraftNameChange}
          typeLabel={t(meta.titleKey)} typeIcon={meta.icon} t={t} />

        <BuilderToolbar
          t={t}
          templates={['formal', 'modern', 'minimal']}
          templateLabelPrefix="letter.template."
          template={template} onTemplate={setTemplate}
          pageSize={pageSize} onPageSize={setPageSize}
          accentId={accentId} onAccent={setAccentId}
          canUndo={undoable.canUndo} canRedo={undoable.canRedo}
          onUndo={undoable.undo} onRedo={undoable.redo}
          onReset={() => setShowResetModal(true)}
          onPrint={print}
          onExportPdf={exportPdf} onExportDocx={exportDocx}
          exportingPdf={exportingPdf} exportingDocx={exportingDocx}
        />

        <div className="builder-meta-row">
          <p className="saved-note">{t('builder.savedNote')}</p>
          <p className={`page-count-note ${pageCount > 1 ? 'is-overflow' : ''}`}>
            {pageCount === 1
              ? t('builder.pageCountSingle')
              : t('builder.pageCountMulti').replace('{0}', String(pageCount))}
          </p>
        </div>

        <div className="builder-ux-row">
          <button type="button" className={`ux-toggle ${sixSecondView ? 'is-active' : ''}`}
            onClick={() => setSixSecondView((v) => !v)} title={t('builder.sixSecondHint')}>
            <span className="ux-toggle-icon">👁</span>
            {t('builder.sixSecondBtn')}
          </button>
          <button type="button" className={`ux-toggle ${readingAloud ? 'is-active' : ''}`}
            onClick={toggleReadAloud} title={t('builder.readAloudHint')}>
            <span className="ux-toggle-icon">{readingAloud ? '⏹' : '🔊'}</span>
            {readingAloud ? t('builder.readAloudStop') : t('builder.readAloudBtn')}
          </button>
        </div>

        <FieldSet title={t('letter.sectionSender')} t={t}>
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
        </FieldSet>

        <FieldSet title={t('letter.sectionRecipient')} t={t}>
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
        </FieldSet>

        <FieldSet title={t('letter.sectionMeta')} t={t}>
          <div className="grid-2">
            <DateField label={t('letter.fieldDate')} value={letter.date}
              onChange={(v) => updateField('date', v)} picker="date" />
            <Field label={t('letter.fieldSubject')} value={letter.subject}
              onChange={(v) => updateField('subject', v)} />
          </div>
        </FieldSet>

        <FieldSet title={t('letter.sectionContent')} t={t}>
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
        </FieldSet>
      </div>

      <div className={`builder-preview-wrap ${sixSecondView ? 'is-six-second' : ''}`}>
        <div className="builder-preview-inner" data-page-count={pageCount} style={accentVars(accent)}>
          {sixSecondView && (
            <div className="six-second-banner no-print">
              <p className="six-second-eyebrow">{t('builder.sixSecondTitle')}</p>
              <p className="six-second-body">{t('builder.sixSecondBody')}</p>
            </div>
          )}
          <LetterDocument letter={letter} template={template} pageSize={pageSize}
            lang={lang} onPageCount={handlePageCount} />
        </div>
      </div>

      <ResetModal open={showResetModal} t={t}
        onCancel={() => setShowResetModal(false)} onConfirm={reset} />
    </div>
  );
}

export default LetterBuilder;
