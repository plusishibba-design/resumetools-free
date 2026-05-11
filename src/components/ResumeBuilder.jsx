import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import ResumeDocument from './document/ResumeDocument';
import BulletCoach from './coaches/BulletCoach';
import BuilderToolbar from './builder/BuilderToolbar';
import ResetModal from './builder/ResetModal';
import DraftNameRow from './builder/DraftNameRow';
import { Field, FieldSet, RepeatBlock, DateField } from './builder/FormFields';
import useUndoable from '../hooks/useUndoable';
import useUndoableShortcuts from '../hooks/useUndoableShortcuts';
import { ResumeNarrator, buildResumeNarration } from '../lib/analysis/readAloud';
import { DEFAULT_ACCENT_ID, getAccent, accentVars } from '../lib/analysis/accentColors';
import {
  migrateLegacyIfNeeded,
  saveDraft,
  getCurrentDraftId,
  setCurrentDraftId,
  listDrafts,
  loadDraft,
  createDraft,
  renameDraft,
} from '../lib/drafts/draftsStore';
import { DEFAULT_DRAFT_BODY, DEFAULT_RESUME, DEFAULT_SECTIONS_CONFIG } from '../lib/drafts/defaultResume';

function normalizeSkills(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return [{ category: '', items: value }];
  }
  return [{ category: '', items: '' }];
}

function normalizeResume(r) {
  return {
    personal: {
      name: '', headline: '', email: '', phone: '', location: '',
      website: '', linkedin: '', github: '', photo: '',
      ...r.personal,
    },
    summary: r.summary || '',
    experiences: (r.experiences || []).map((e) => ({
      role: '', company: '', location: '', start: '', end: '', current: false, bullets: '',
      ...e,
    })),
    educations: (r.educations || []).map((e) => ({
      degree: '', school: '', location: '', start: '', end: '',
      ...e,
    })),
    certifications: r.certifications || [],
    projects: r.projects || [],
    awards: r.awards || [],
    volunteer: r.volunteer || [],
    skills: normalizeSkills(r.skills),
    languages: r.languages || [],
    interests: r.interests || '',
    sectionsConfig: r.sectionsConfig || DEFAULT_SECTIONS_CONFIG,
  };
}

function ResumeBuilder() {
  const { t, lang } = useLanguage();

  // === One-time draft init ===
  // Pick a resume-type draft. If the current draft is a letter, look for
  // any existing resume draft; if none exists, create a new one. This
  // prevents the builder from clobbering a letter draft with resume data.
  const initRef = useRef(null);
  if (initRef.current === null) {
    try { migrateLegacyIfNeeded(DEFAULT_DRAFT_BODY); } catch (e) { console.warn(e); }
    let dId = null;
    let body = null;
    try {
      const currentId = getCurrentDraftId();
      const current = currentId ? loadDraft(currentId) : null;
      if (current && (!current.type || current.type === 'resume')) {
        dId = currentId;
        body = current;
      } else {
        const resumeMeta = listDrafts().find((d) => {
          const b = loadDraft(d.id);
          return b && (!b.type || b.type === 'resume');
        });
        if (resumeMeta) {
          dId = resumeMeta.id;
          body = loadDraft(resumeMeta.id);
          setCurrentDraftId(dId);
        }
      }
      if (!dId) {
        dId = createDraft('Untitled', DEFAULT_DRAFT_BODY);
        setCurrentDraftId(dId);
        body = DEFAULT_DRAFT_BODY;
      }
    } catch (e) {
      console.warn('Draft load error:', e);
      dId = 'fallback';
      body = DEFAULT_DRAFT_BODY;
    }
    initRef.current = {
      id: dId,
      resume: normalizeResume(body?.resume || DEFAULT_RESUME),
      template: body?.template || 'classic',
      pageSize: body?.pageSize || 'a4',
      accentColor: body?.accentColor || DEFAULT_ACCENT_ID,
    };
  }
  const init = initRef.current;

  const [draftId] = useState(init.id);
  const undoable = useUndoable(init.resume);
  const resume = undoable.state;
  const [template, setTemplate] = useState(init.template);
  const [pageSize, setPageSize] = useState(init.pageSize);
  const [accentId, setAccentId] = useState(init.accentColor);
  const accent = getAccent(accentId);
  const [pageCount, setPageCount] = useState(1);
  const [showResetModal, setShowResetModal] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sixSecondView, setSixSecondView] = useState(false);
  const [readingAloud, setReadingAloud] = useState(false);
  const narratorRef = useRef(null);

  const [draftName, setDraftName] = useState(() => {
    const meta = listDrafts().find((d) => d.id === draftId);
    return meta?.name || 'Untitled';
  });

  // Persist
  useEffect(() => {
    saveDraft(draftId, { type: 'resume', resume, template, pageSize, accentColor: accentId });
  }, [resume, template, pageSize, accentId, draftId]);

  // @page rule
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'resume-page-rule';
    styleEl.textContent = `@page { size: ${pageSize === 'letter' ? 'letter' : 'A4'}; margin: 0; }`;
    document.head.appendChild(styleEl);
    return () => {
      const existing = document.getElementById('resume-page-rule');
      if (existing) existing.remove();
    };
  }, [pageSize]);

  // Keyboard undo/redo
  useUndoableShortcuts(undoable);

  // Read-aloud
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
      n.speak(buildResumeNarration(resume, t));
      setReadingAloud(true);
    }
  };

  const handlePageCount = useCallback((n) => setPageCount(n), []);

  // === Update helpers ===
  const setResume = undoable.setState;
  const updatePersonal = (k, v) => setResume((r) => ({ ...r, personal: { ...r.personal, [k]: v } }));
  const updateField = (k, v) => setResume((r) => ({ ...r, [k]: v }));
  const updateListItem = (k, i, f, v) =>
    setResume((r) => {
      const list = [...r[k]];
      list[i] = { ...list[i], [f]: v };
      return { ...r, [k]: list };
    });
  const addListItem = (k, item) => setResume((r) => ({ ...r, [k]: [...r[k], item] }));
  const removeListItem = (k, i) => setResume((r) => ({ ...r, [k]: r[k].filter((_, idx) => idx !== i) }));
  const moveListItem = (k, i, dir) =>
    setResume((r) => {
      const list = [...r[k]];
      const newIdx = i + dir;
      if (newIdx < 0 || newIdx >= list.length) return r;
      [list[i], list[newIdx]] = [list[newIdx], list[i]];
      return { ...r, [k]: list };
    });
  const moveSection = (id, dir) =>
    setResume((r) => {
      const list = [...r.sectionsConfig];
      const idx = list.findIndex((s) => s.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= list.length) return r;
      [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
      return { ...r, sectionsConfig: list };
    });
  const toggleSection = (id) =>
    setResume((r) => ({
      ...r,
      sectionsConfig: r.sectionsConfig.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    }));

  const reset = () => {
    undoable.replace(normalizeResume(DEFAULT_RESUME));
    setShowResetModal(false);
  };

  const print = () => window.print();
  const safeFilenameStem = () =>
    draftName.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'resume';

  const exportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const { exportToPdf } = await import('../lib/exporters/exportPdf');
      const element = document.querySelector('.resume-doc');
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
      const { exportResumeToDocx } = await import('../lib/exporters/exportResumeDocx');
      await exportResumeToDocx(resume, t, `${safeFilenameStem()}.docx`);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(t('builder.docxFailed'));
    } finally {
      setExportingDocx(false);
    }
  };

  // Photo
  const photoInputRef = useRef(null);
  const onPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { alert(t('builder.photoTooLarge')); return; }
    const reader = new FileReader();
    reader.onload = (ev) => updatePersonal('photo', ev.target.result);
    reader.readAsDataURL(file);
  };
  const clearPhoto = () => updatePersonal('photo', '');

  const onDraftNameChange = (newName) => {
    setDraftName(newName);
    renameDraft(draftId, newName);
  };

  // === Section render registry ===
  const renderSection = (sectionId) => {
    switch (sectionId) {
      case 'summary':
        return <Field label={t('builder.fieldSummary')} value={resume.summary}
          onChange={(v) => updateField('summary', v)} multiline rows={4} hint={t('builder.bulletHint')} />;

      case 'experience':
        return (
          <>
            {resume.experiences.map((exp, i) => (
              <RepeatBlock key={i} idx={i} count={resume.experiences.length}
                onMove={(dir) => moveListItem('experiences', i, dir)}
                onRemove={() => removeListItem('experiences', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldRole')} value={exp.role}
                    onChange={(v) => updateListItem('experiences', i, 'role', v)} />
                  <Field label={t('builder.fieldCompany')} value={exp.company}
                    onChange={(v) => updateListItem('experiences', i, 'company', v)} />
                  <Field label={t('builder.fieldExpLocation')} value={exp.location}
                    onChange={(v) => updateListItem('experiences', i, 'location', v)} />
                  <div />
                  <DateField label={t('builder.fieldStart')} value={exp.start}
                    onChange={(v) => updateListItem('experiences', i, 'start', v)} />
                  <DateField label={t('builder.fieldEnd')} value={exp.end} disabled={exp.current}
                    onChange={(v) => updateListItem('experiences', i, 'end', v)} />
                </div>
                <label className="checkbox-row">
                  <input type="checkbox" checked={!!exp.current}
                    onChange={(e) => updateListItem('experiences', i, 'current', e.target.checked)} />
                  <span>{t('builder.currentJob')}</span>
                </label>
                <Field label={t('builder.fieldBullets')} value={exp.bullets}
                  onChange={(v) => updateListItem('experiences', i, 'bullets', v)}
                  multiline rows={4} hint={t('builder.bulletHint')} />
                <BulletCoach value={exp.bullets} t={t} />
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('experiences', {
                role: '', company: '', location: '', start: '', end: '', current: false, bullets: '',
              })}>
              {t('builder.addExperience')}
            </button>
          </>
        );

      case 'education':
        return (
          <>
            {resume.educations.map((edu, i) => (
              <RepeatBlock key={i} idx={i} count={resume.educations.length}
                onMove={(dir) => moveListItem('educations', i, dir)}
                onRemove={() => removeListItem('educations', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldDegree')} value={edu.degree}
                    onChange={(v) => updateListItem('educations', i, 'degree', v)} />
                  <Field label={t('builder.fieldSchool')} value={edu.school}
                    onChange={(v) => updateListItem('educations', i, 'school', v)} />
                  <Field label={t('builder.fieldEduLocation')} value={edu.location}
                    onChange={(v) => updateListItem('educations', i, 'location', v)} />
                  <div />
                  <Field label={t('builder.fieldEduStart')} value={edu.start}
                    onChange={(v) => updateListItem('educations', i, 'start', v)} />
                  <Field label={t('builder.fieldEduEnd')} value={edu.end}
                    onChange={(v) => updateListItem('educations', i, 'end', v)} />
                </div>
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('educations', {
                degree: '', school: '', location: '', start: '', end: '',
              })}>
              {t('builder.addEducation')}
            </button>
          </>
        );

      case 'certifications':
        return (
          <>
            {resume.certifications.map((cert, i) => (
              <RepeatBlock key={i} idx={i} count={resume.certifications.length}
                onMove={(dir) => moveListItem('certifications', i, dir)}
                onRemove={() => removeListItem('certifications', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldCertName')} value={cert.name}
                    onChange={(v) => updateListItem('certifications', i, 'name', v)} />
                  <Field label={t('builder.fieldCertIssuer')} value={cert.issuer}
                    onChange={(v) => updateListItem('certifications', i, 'issuer', v)} />
                  <Field label={t('builder.fieldCertDate')} value={cert.date}
                    onChange={(v) => updateListItem('certifications', i, 'date', v)} />
                  <Field label={t('builder.fieldCertId')} value={cert.credentialId}
                    onChange={(v) => updateListItem('certifications', i, 'credentialId', v)} />
                </div>
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('certifications', {
                name: '', issuer: '', date: '', credentialId: '',
              })}>
              {t('builder.addCertification')}
            </button>
          </>
        );

      case 'projects':
        return (
          <>
            {resume.projects.map((p, i) => (
              <RepeatBlock key={i} idx={i} count={resume.projects.length}
                onMove={(dir) => moveListItem('projects', i, dir)}
                onRemove={() => removeListItem('projects', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldProjectName')} value={p.name}
                    onChange={(v) => updateListItem('projects', i, 'name', v)} />
                  <Field label={t('builder.fieldProjectDates')} value={p.dates}
                    onChange={(v) => updateListItem('projects', i, 'dates', v)} />
                </div>
                <Field label={t('builder.fieldProjectLink')} value={p.link}
                  onChange={(v) => updateListItem('projects', i, 'link', v)} />
                <Field label={t('builder.fieldProjectDesc')} value={p.description}
                  onChange={(v) => updateListItem('projects', i, 'description', v)} multiline rows={3} />
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('projects', { name: '', description: '', link: '', dates: '' })}>
              {t('builder.addProject')}
            </button>
          </>
        );

      case 'awards':
        return (
          <>
            {resume.awards.map((a, i) => (
              <RepeatBlock key={i} idx={i} count={resume.awards.length}
                onMove={(dir) => moveListItem('awards', i, dir)}
                onRemove={() => removeListItem('awards', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldAwardName')} value={a.name}
                    onChange={(v) => updateListItem('awards', i, 'name', v)} />
                  <Field label={t('builder.fieldAwardIssuer')} value={a.issuer}
                    onChange={(v) => updateListItem('awards', i, 'issuer', v)} />
                  <Field label={t('builder.fieldAwardDate')} value={a.date}
                    onChange={(v) => updateListItem('awards', i, 'date', v)} />
                </div>
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('awards', { name: '', issuer: '', date: '' })}>
              {t('builder.addAward')}
            </button>
          </>
        );

      case 'volunteer':
        return (
          <>
            {resume.volunteer.map((v, i) => (
              <RepeatBlock key={i} idx={i} count={resume.volunteer.length}
                onMove={(dir) => moveListItem('volunteer', i, dir)}
                onRemove={() => removeListItem('volunteer', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldVolRole')} value={v.role}
                    onChange={(val) => updateListItem('volunteer', i, 'role', val)} />
                  <Field label={t('builder.fieldVolOrg')} value={v.organization}
                    onChange={(val) => updateListItem('volunteer', i, 'organization', val)} />
                  <Field label={t('builder.fieldVolDates')} value={v.dates}
                    onChange={(val) => updateListItem('volunteer', i, 'dates', val)} />
                </div>
                <Field label={t('builder.fieldVolDesc')} value={v.description}
                  onChange={(val) => updateListItem('volunteer', i, 'description', val)} multiline rows={2} />
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('volunteer', {
                role: '', organization: '', dates: '', description: '',
              })}>
              {t('builder.addVolunteer')}
            </button>
          </>
        );

      case 'skills':
        return (
          <>
            {resume.skills.map((g, i) => (
              <RepeatBlock key={i} idx={i} count={resume.skills.length}
                onMove={(dir) => moveListItem('skills', i, dir)}
                onRemove={() => removeListItem('skills', i)} t={t}>
                <Field label={t('builder.fieldSkillCategory')} value={g.category}
                  onChange={(v) => updateListItem('skills', i, 'category', v)}
                  hint={t('builder.skillCategoryHint')} />
                <Field label={t('builder.fieldSkillItems')} value={g.items}
                  onChange={(v) => updateListItem('skills', i, 'items', v)} multiline rows={2} />
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('skills', { category: '', items: '' })}>
              {t('builder.addSkillGroup')}
            </button>
          </>
        );

      case 'languages':
        return (
          <>
            {resume.languages.map((lang, i) => (
              <RepeatBlock key={i} idx={i} count={resume.languages.length}
                onMove={(dir) => moveListItem('languages', i, dir)}
                onRemove={() => removeListItem('languages', i)} t={t}>
                <div className="grid-2">
                  <Field label={t('builder.fieldLangName')} value={lang.name}
                    onChange={(v) => updateListItem('languages', i, 'name', v)} />
                  <Field label={t('builder.fieldLangLevel')} value={lang.level}
                    onChange={(v) => updateListItem('languages', i, 'level', v)} />
                </div>
              </RepeatBlock>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('languages', { name: '', level: '' })}>
              {t('builder.addLanguage')}
            </button>
          </>
        );

      case 'interests':
        return <Field label={t('builder.fieldInterests')} value={resume.interests}
          onChange={(v) => updateField('interests', v)} multiline rows={2} hint={t('builder.interestsHint')} />;

      default:
        return null;
    }
  };

  const sectionTitleKey = (id) => `builder.section${id[0].toUpperCase() + id.slice(1)}`;

  return (
    <div className="builder-layout">
      <div className="builder-form no-print" data-reveal>
        <DraftNameRow name={draftName} onChange={onDraftNameChange} t={t} />

        <BuilderToolbar
          t={t}
          templates={[
            { id: 'classic', labelKey: 'builder.templateClassic' },
            { id: 'modern', labelKey: 'builder.templateModern' },
            { id: 'compact', labelKey: 'builder.templateCompact' },
          ]}
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
        {pageCount > 1 && template !== 'compact' && (
          <p className="overflow-hint">{t('builder.overflowHint')}</p>
        )}

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

        {/* Personal — always first, not reorderable */}
        <FieldSet title={t('builder.sectionPersonal')} t={t}>
          <div className="grid-2">
            <Field label={t('builder.fieldName')} value={resume.personal.name}
              onChange={(v) => updatePersonal('name', v)} />
            <Field label={t('builder.fieldHeadline')} value={resume.personal.headline}
              onChange={(v) => updatePersonal('headline', v)} />
            <Field label={t('builder.fieldEmail')} value={resume.personal.email}
              onChange={(v) => updatePersonal('email', v)} type="email" />
            <Field label={t('builder.fieldPhone')} value={resume.personal.phone}
              onChange={(v) => updatePersonal('phone', v)} />
            <Field label={t('builder.fieldLocation')} value={resume.personal.location}
              onChange={(v) => updatePersonal('location', v)} />
            <Field label={t('builder.fieldWebsite')} value={resume.personal.website}
              onChange={(v) => updatePersonal('website', v)} />
            <Field label={t('builder.fieldLinkedin')} value={resume.personal.linkedin}
              onChange={(v) => updatePersonal('linkedin', v)} />
            <Field label={t('builder.fieldGithub')} value={resume.personal.github}
              onChange={(v) => updatePersonal('github', v)} />
          </div>
          <div className="photo-field">
            <label className="photo-label">{t('builder.fieldPhoto')}</label>
            <div className="photo-row">
              {resume.personal.photo ? (
                <img src={resume.personal.photo} alt="" className="photo-preview" />
              ) : (
                <div className="photo-placeholder"><span>{t('builder.photoNone')}</span></div>
              )}
              <div className="photo-actions">
                <input type="file" accept="image/*" ref={photoInputRef}
                  onChange={onPhotoSelect} style={{ display: 'none' }} />
                <button type="button" className="cta-ghost"
                  onClick={() => photoInputRef.current?.click()}>
                  {resume.personal.photo ? t('builder.photoReplace') : t('builder.photoUpload')}
                </button>
                {resume.personal.photo && (
                  <button type="button" className="cta-ghost danger" onClick={clearPhoto}>
                    {t('builder.photoRemove')}
                  </button>
                )}
              </div>
            </div>
            <p className="field-hint">{t('builder.photoHint')}</p>
          </div>
        </FieldSet>

        {resume.sectionsConfig.map((s, idx) => (
          <FieldSet key={s.id} title={t(sectionTitleKey(s.id))} visible={s.visible}
            onToggle={() => toggleSection(s.id)}
            onMoveUp={idx > 0 ? () => moveSection(s.id, -1) : null}
            onMoveDown={idx < resume.sectionsConfig.length - 1 ? () => moveSection(s.id, +1) : null}
            t={t}>
            {renderSection(s.id)}
          </FieldSet>
        ))}
      </div>

      <div className={`builder-preview-wrap ${sixSecondView ? 'is-six-second' : ''}`}>
        <div className="builder-preview-inner" data-page-count={pageCount} style={accentVars(accent)}>
          {sixSecondView && (
            <div className="six-second-banner no-print">
              <p className="six-second-eyebrow">{t('builder.sixSecondTitle')}</p>
              <p className="six-second-body">{t('builder.sixSecondBody')}</p>
            </div>
          )}
          <ResumeDocument resume={resume} template={template} pageSize={pageSize}
            t={t} onPageCount={handlePageCount} />
        </div>
      </div>

      <ResetModal open={showResetModal} t={t}
        onCancel={() => setShowResetModal(false)} onConfirm={reset} />
    </div>
  );
}

export default ResumeBuilder;
