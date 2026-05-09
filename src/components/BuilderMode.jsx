import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import ResumeDocument from './ResumeDocument';

const STORAGE_KEY = 'resumetools-data-v2';
const TEMPLATE_KEY = 'resumetools-template-v1';
const PAGESIZE_KEY = 'resumetools-pagesize-v1';
const LEGACY_KEY = 'resumetools-data-v1';

const DEFAULT_SECTIONS_CONFIG = [
  { id: 'summary', visible: true },
  { id: 'experience', visible: true },
  { id: 'education', visible: true },
  { id: 'certifications', visible: true },
  { id: 'projects', visible: true },
  { id: 'awards', visible: true },
  { id: 'volunteer', visible: false },
  { id: 'skills', visible: true },
  { id: 'languages', visible: true },
  { id: 'interests', visible: false },
];

const SAMPLE_RESUME = {
  personal: {
    name: 'Mai Nguyen',
    headline: 'Senior Product Designer',
    email: 'mai@example.com',
    phone: '+84 90 123 4567',
    location: 'Ho Chi Minh City',
    website: 'mainguyen.design',
    linkedin: 'linkedin.com/in/mainguyen',
    github: 'github.com/mainguyen',
  },
  summary:
    'Product designer with 8 years of experience leading end-to-end design for B2B SaaS and consumer fintech. Strong systems thinker who pairs editorial craft with rigorous UX research.',
  experiences: [
    {
      role: 'Senior Product Designer',
      company: 'Atlas Studio',
      location: 'Ho Chi Minh City',
      start: 'Jan 2022',
      end: 'Present',
      bullets:
        'Led the redesign of the core dashboard, reducing time-to-first-action by **38%**.\nManaged a team of 3 designers and partnered with **12 engineers** across 4 squads.\nDefined the design system that now serves **14 products** across the company.',
    },
    {
      role: 'Product Designer',
      company: 'Lotus Bank',
      location: 'Ho Chi Minh City',
      start: 'Mar 2019',
      end: 'Dec 2021',
      bullets:
        'Designed the mobile onboarding flow that lifted activation by **22%**.\nShipped the first Vietnamese-language banking app meeting **WCAG AA** contrast.\nResearched and documented **40+ user interviews** with small-business owners.',
    },
  ],
  educations: [
    {
      degree: 'B.A. Visual Communication',
      school: 'Hanoi University of Industrial Fine Arts',
      location: 'Hanoi',
      start: '2013',
      end: '2017',
    },
  ],
  certifications: [
    {
      name: 'Certified Scrum Master',
      issuer: 'Scrum Alliance',
      date: '2023',
      credentialId: 'CSM-12345',
    },
  ],
  projects: [
    {
      name: 'Lotus — Open-source Design System',
      description: 'An 80-component design system released under MIT, used by 500+ teams.',
      link: 'github.com/mainguyen/lotus',
      dates: '2022 — Present',
    },
  ],
  awards: [
    {
      name: 'Vietnam UX Awards — Gold',
      issuer: 'Vietnam UX Society',
      date: '2024',
    },
  ],
  volunteer: [
    {
      role: 'Mentor',
      organization: 'ADPList',
      dates: '2021 — Present',
      description: 'Mentored 40+ designers from underrepresented backgrounds in 1:1 portfolio reviews.',
    },
  ],
  skills:
    'Product Design, UX Research, Figma, Design Systems, Prototyping, Accessibility, Vietnamese, English',
  languages: [
    { name: 'Vietnamese', level: 'Native' },
    { name: 'English', level: 'Fluent' },
    { name: 'Japanese', level: 'B1' },
  ],
  interests: 'Editorial typography, vintage cameras, Vietnamese coffee culture, weekend long-distance running',
  sectionsConfig: DEFAULT_SECTIONS_CONFIG,
};

function loadResume() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate: ensure all expected keys exist
      return migrate(parsed);
    }
    // Try legacy v1
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return migrate(parsed);
    }
  } catch {}
  return SAMPLE_RESUME;
}

function migrate(data) {
  // Ensure new fields exist (for users coming from v0.1)
  return {
    personal: { github: '', ...data.personal },
    summary: data.summary || '',
    experiences: data.experiences || [],
    educations: data.educations || [],
    certifications: data.certifications || [],
    projects: data.projects || [],
    awards: data.awards || [],
    volunteer: data.volunteer || [],
    skills: data.skills || '',
    languages: data.languages || [],
    interests: data.interests || '',
    sectionsConfig: data.sectionsConfig || DEFAULT_SECTIONS_CONFIG,
  };
}

function loadTemplate() {
  try {
    const tmpl = localStorage.getItem(TEMPLATE_KEY);
    if (tmpl === 'classic' || tmpl === 'modern' || tmpl === 'compact') return tmpl;
  } catch {}
  return 'classic';
}

function loadPageSize() {
  try {
    const ps = localStorage.getItem(PAGESIZE_KEY);
    if (ps === 'a4' || ps === 'letter') return ps;
  } catch {}
  return 'a4';
}

function BuilderMode() {
  const { t } = useLanguage();
  const [resume, setResume] = useState(loadResume);
  const [template, setTemplate] = useState(loadTemplate);
  const [pageSize, setPageSize] = useState(loadPageSize);
  const [pageCount, setPageCount] = useState(1);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_KEY, template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem(PAGESIZE_KEY, pageSize);
  }, [pageSize]);

  // Inject @page rule for the chosen page size
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

  const handlePageCount = useCallback((n) => setPageCount(n), []);

  const updatePersonal = (key, value) =>
    setResume((r) => ({ ...r, personal: { ...r.personal, [key]: value } }));

  const updateField = (key, value) =>
    setResume((r) => ({ ...r, [key]: value }));

  // Generic list helpers ------------------------------------------------
  const updateListItem = (key, i, field, value) =>
    setResume((r) => {
      const list = [...r[key]];
      list[i] = { ...list[i], [field]: value };
      return { ...r, [key]: list };
    });

  const addListItem = (key, item) =>
    setResume((r) => ({ ...r, [key]: [...r[key], item] }));

  const removeListItem = (key, i) =>
    setResume((r) => ({ ...r, [key]: r[key].filter((_, idx) => idx !== i) }));

  // Section config helpers ----------------------------------------------
  const moveSection = (id, dir) => {
    setResume((r) => {
      const list = [...r.sectionsConfig];
      const idx = list.findIndex((s) => s.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= list.length) return r;
      [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
      return { ...r, sectionsConfig: list };
    });
  };

  const toggleSection = (id) => {
    setResume((r) => ({
      ...r,
      sectionsConfig: r.sectionsConfig.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    }));
  };

  const reset = () => {
    setResume(SAMPLE_RESUME);
    setShowResetModal(false);
  };

  const print = () => window.print();

  // Section render registry — each renders a form panel
  const renderSection = (sectionId) => {
    switch (sectionId) {
      case 'summary':
        return (
          <Field
            label={t('builder.fieldSummary')}
            value={resume.summary}
            onChange={(v) => updateField('summary', v)}
            multiline rows={4}
          />
        );

      case 'experience':
        return (
          <>
            {resume.experiences.map((exp, i) => (
              <div key={i} className="repeat-block">
                <div className="grid-2">
                  <Field label={t('builder.fieldRole')} value={exp.role}
                    onChange={(v) => updateListItem('experiences', i, 'role', v)} />
                  <Field label={t('builder.fieldCompany')} value={exp.company}
                    onChange={(v) => updateListItem('experiences', i, 'company', v)} />
                  <Field label={t('builder.fieldExpLocation')} value={exp.location}
                    onChange={(v) => updateListItem('experiences', i, 'location', v)} />
                  <div />
                  <Field label={t('builder.fieldStart')} value={exp.start}
                    onChange={(v) => updateListItem('experiences', i, 'start', v)} />
                  <Field label={t('builder.fieldEnd')} value={exp.end}
                    onChange={(v) => updateListItem('experiences', i, 'end', v)} />
                </div>
                <Field label={t('builder.fieldBullets')} value={exp.bullets}
                  onChange={(v) => updateListItem('experiences', i, 'bullets', v)}
                  multiline rows={4} hint={t('builder.bulletHint')} />
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('experiences', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('experiences', {
                role: '', company: '', location: '', start: '', end: '', bullets: '',
              })}>
              {t('builder.addExperience')}
            </button>
          </>
        );

      case 'education':
        return (
          <>
            {resume.educations.map((edu, i) => (
              <div key={i} className="repeat-block">
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
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('educations', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
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
              <div key={i} className="repeat-block">
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
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('certifications', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
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
              <div key={i} className="repeat-block">
                <div className="grid-2">
                  <Field label={t('builder.fieldProjectName')} value={p.name}
                    onChange={(v) => updateListItem('projects', i, 'name', v)} />
                  <Field label={t('builder.fieldProjectDates')} value={p.dates}
                    onChange={(v) => updateListItem('projects', i, 'dates', v)} />
                </div>
                <Field label={t('builder.fieldProjectLink')} value={p.link}
                  onChange={(v) => updateListItem('projects', i, 'link', v)} />
                <Field label={t('builder.fieldProjectDesc')} value={p.description}
                  onChange={(v) => updateListItem('projects', i, 'description', v)}
                  multiline rows={3} />
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('projects', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('projects', {
                name: '', description: '', link: '', dates: '',
              })}>
              {t('builder.addProject')}
            </button>
          </>
        );

      case 'awards':
        return (
          <>
            {resume.awards.map((a, i) => (
              <div key={i} className="repeat-block">
                <div className="grid-2">
                  <Field label={t('builder.fieldAwardName')} value={a.name}
                    onChange={(v) => updateListItem('awards', i, 'name', v)} />
                  <Field label={t('builder.fieldAwardIssuer')} value={a.issuer}
                    onChange={(v) => updateListItem('awards', i, 'issuer', v)} />
                  <Field label={t('builder.fieldAwardDate')} value={a.date}
                    onChange={(v) => updateListItem('awards', i, 'date', v)} />
                </div>
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('awards', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
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
              <div key={i} className="repeat-block">
                <div className="grid-2">
                  <Field label={t('builder.fieldVolRole')} value={v.role}
                    onChange={(val) => updateListItem('volunteer', i, 'role', val)} />
                  <Field label={t('builder.fieldVolOrg')} value={v.organization}
                    onChange={(val) => updateListItem('volunteer', i, 'organization', val)} />
                  <Field label={t('builder.fieldVolDates')} value={v.dates}
                    onChange={(val) => updateListItem('volunteer', i, 'dates', val)} />
                </div>
                <Field label={t('builder.fieldVolDesc')} value={v.description}
                  onChange={(val) => updateListItem('volunteer', i, 'description', val)}
                  multiline rows={2} />
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('volunteer', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
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
          <Field label={t('builder.fieldSkills')} value={resume.skills}
            onChange={(v) => updateField('skills', v)}
            multiline rows={2} />
        );

      case 'languages':
        return (
          <>
            {resume.languages.map((lang, i) => (
              <div key={i} className="repeat-block">
                <div className="grid-2">
                  <Field label={t('builder.fieldLangName')} value={lang.name}
                    onChange={(v) => updateListItem('languages', i, 'name', v)} />
                  <Field label={t('builder.fieldLangLevel')} value={lang.level}
                    onChange={(v) => updateListItem('languages', i, 'level', v)} />
                </div>
                <button type="button" className="remove-btn"
                  onClick={() => removeListItem('languages', i)}>
                  {t('builder.removeBtn')}
                </button>
              </div>
            ))}
            <button type="button" className="add-btn"
              onClick={() => addListItem('languages', { name: '', level: '' })}>
              {t('builder.addLanguage')}
            </button>
          </>
        );

      case 'interests':
        return (
          <Field label={t('builder.fieldInterests')} value={resume.interests}
            onChange={(v) => updateField('interests', v)}
            multiline rows={2}
            hint={t('builder.interestsHint')} />
        );

      default:
        return null;
    }
  };

  const sectionTitleKey = (id) => `builder.section${id[0].toUpperCase() + id.slice(1)}`;

  return (
    <div className="builder-layout">
      {/* LEFT: form panel */}
      <div className="builder-form no-print" data-reveal>
        {/* Toolbar */}
        <div className="builder-toolbar">
          <div className="builder-template-picker">
            <span className="picker-label">{t('builder.templateLabel')}</span>
            <div className="picker-buttons">
              {['classic', 'modern', 'compact'].map((tmpl) => (
                <button key={tmpl} type="button"
                  className={`picker-btn ${template === tmpl ? 'is-active' : ''}`}
                  onClick={() => setTemplate(tmpl)}>
                  {t(`builder.template${tmpl[0].toUpperCase() + tmpl.slice(1)}`)}
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
            <button type="button" className="cta-ghost"
              onClick={() => setShowResetModal(true)}>
              {t('builder.resetBtn')}
            </button>
            <button type="button" className="cta-primary" onClick={print}>
              {t('builder.printBtn')}
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
        {pageCount > 1 && template !== 'compact' && (
          <p className="overflow-hint">{t('builder.overflowHint')}</p>
        )}

        {/* Personal — always first, not reorderable */}
        <FieldSet title={t('builder.sectionPersonal')}>
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
        </FieldSet>

        {/* Reorderable sections */}
        {resume.sectionsConfig.map((s, idx) => (
          <FieldSet
            key={s.id}
            title={t(sectionTitleKey(s.id))}
            visible={s.visible}
            onToggle={() => toggleSection(s.id)}
            onMoveUp={idx > 0 ? () => moveSection(s.id, -1) : null}
            onMoveDown={idx < resume.sectionsConfig.length - 1 ? () => moveSection(s.id, +1) : null}
            t={t}
          >
            {renderSection(s.id)}
          </FieldSet>
        ))}
      </div>

      {/* RIGHT: live preview */}
      <div className="builder-preview-wrap">
        <div className="builder-preview-inner" data-page-count={pageCount}>
          <ResumeDocument
            resume={resume}
            template={template}
            pageSize={pageSize}
            t={t}
            onPageCount={handlePageCount}
          />
        </div>
      </div>

      {/* Reset modal */}
      {showResetModal && (
        <div className="modal-backdrop no-print"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3>{t('builder.resetModalTitle')}</h3>
            <p>{t('builder.resetModalBody')}</p>
            <div className="modal-actions">
              <button type="button" className="cta-ghost"
                onClick={() => setShowResetModal(false)}>
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

function FieldSet({ title, children, visible, onToggle, onMoveUp, onMoveDown, t }) {
  const showControls = onToggle != null;
  return (
    <fieldset className={`builder-fieldset ${visible === false ? 'is-hidden' : ''}`}>
      <legend>
        <span>{title}</span>
        {showControls && (
          <span className="fieldset-controls">
            <button type="button" className="fs-ctrl"
              onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move up">↑</button>
            <button type="button" className="fs-ctrl"
              onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move down">↓</button>
            <button type="button" className="fs-ctrl fs-ctrl-toggle"
              onClick={onToggle} aria-pressed={!visible}>
              {visible ? t('builder.hideBtn') : t('builder.showBtn')}
            </button>
          </span>
        )}
      </legend>
      {children}
    </fieldset>
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

export default BuilderMode;
