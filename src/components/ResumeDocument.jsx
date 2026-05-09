import React, { useEffect, useRef, useState } from 'react';

// Page dimensions (mm)
const PAGE_DIMS = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};
// 1mm at 96dpi ≈ 3.7795px (CSS px)
const MM_TO_PX = 3.7795;

// Markdown-style **bold** parser for bullets / inline text.
// Returns React fragments — never injects raw HTML.
function renderBold(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

function ResumeDocument({ resume, template, pageSize = 'a4', t, onPageCount }) {
  const docRef = useRef(null);
  const [pages, setPages] = useState(1);

  const dims = PAGE_DIMS[pageSize] || PAGE_DIMS.a4;

  useEffect(() => {
    if (!docRef.current) return;
    const el = docRef.current;
    const pageHeightPx = dims.h * MM_TO_PX;

    const measure = () => {
      const h = el.scrollHeight;
      const n = Math.max(1, Math.ceil((h - 1) / pageHeightPx));
      setPages(n);
      onPageCount?.(n);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [resume, template, pageSize, onPageCount, dims.h]);

  const skillList = (resume.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const interestList = (resume.interests || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Section render registry
  const sections = {
    summary: () => resume.summary && (
      <section className="resume-section" key="summary">
        <h2>{t('preview.summary')}</h2>
        <p className="resume-summary">{renderBold(resume.summary)}</p>
      </section>
    ),
    experience: () => resume.experiences?.length > 0 && (
      <section className="resume-section" key="experience">
        <h2>{t('preview.experience')}</h2>
        {resume.experiences.map((exp, i) => (
          <div className="resume-entry" key={i}>
            <div className="resume-entry-row">
              <div>
                <h3 className="resume-entry-title">{exp.role}</h3>
                <p className="resume-entry-meta">
                  {[exp.company, exp.location].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="resume-entry-dates">
                {[exp.start, exp.end].filter(Boolean).join(' — ')}
              </p>
            </div>
            {exp.bullets && (
              <ul className="resume-bullets">
                {exp.bullets.split('\n').filter(Boolean).map((b, idx) => (
                  <li key={idx}>{renderBold(b)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    ),
    education: () => resume.educations?.length > 0 && (
      <section className="resume-section" key="education">
        <h2>{t('preview.education')}</h2>
        {resume.educations.map((edu, i) => (
          <div className="resume-entry" key={i}>
            <div className="resume-entry-row">
              <div>
                <h3 className="resume-entry-title">{edu.degree}</h3>
                <p className="resume-entry-meta">
                  {[edu.school, edu.location].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="resume-entry-dates">
                {[edu.start, edu.end].filter(Boolean).join(' — ')}
              </p>
            </div>
          </div>
        ))}
      </section>
    ),
    certifications: () => resume.certifications?.length > 0 && (
      <section className="resume-section" key="certifications">
        <h2>{t('preview.certifications')}</h2>
        {resume.certifications.map((c, i) => (
          <div className="resume-entry resume-entry--compact" key={i}>
            <div className="resume-entry-row">
              <div>
                <h3 className="resume-entry-title">{c.name}</h3>
                <p className="resume-entry-meta">
                  {[c.issuer, c.credentialId].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="resume-entry-dates">{c.date}</p>
            </div>
          </div>
        ))}
      </section>
    ),
    projects: () => resume.projects?.length > 0 && (
      <section className="resume-section" key="projects">
        <h2>{t('preview.projects')}</h2>
        {resume.projects.map((p, i) => (
          <div className="resume-entry" key={i}>
            <div className="resume-entry-row">
              <div>
                <h3 className="resume-entry-title">{p.name}</h3>
                {p.link && <p className="resume-entry-meta">{p.link}</p>}
              </div>
              <p className="resume-entry-dates">{p.dates}</p>
            </div>
            {p.description && (
              <p className="resume-entry-desc">{renderBold(p.description)}</p>
            )}
          </div>
        ))}
      </section>
    ),
    awards: () => resume.awards?.length > 0 && (
      <section className="resume-section" key="awards">
        <h2>{t('preview.awards')}</h2>
        {resume.awards.map((a, i) => (
          <div className="resume-entry resume-entry--compact" key={i}>
            <div className="resume-entry-row">
              <div>
                <h3 className="resume-entry-title">{a.name}</h3>
                {a.issuer && <p className="resume-entry-meta">{a.issuer}</p>}
              </div>
              <p className="resume-entry-dates">{a.date}</p>
            </div>
          </div>
        ))}
      </section>
    ),
    volunteer: () => resume.volunteer?.length > 0 && (
      <section className="resume-section" key="volunteer">
        <h2>{t('preview.volunteer')}</h2>
        {resume.volunteer.map((v, i) => (
          <div className="resume-entry" key={i}>
            <div className="resume-entry-row">
              <div>
                <h3 className="resume-entry-title">{v.role}</h3>
                {v.organization && <p className="resume-entry-meta">{v.organization}</p>}
              </div>
              <p className="resume-entry-dates">{v.dates}</p>
            </div>
            {v.description && (
              <p className="resume-entry-desc">{renderBold(v.description)}</p>
            )}
          </div>
        ))}
      </section>
    ),
    skills: () => skillList.length > 0 && (
      <section className="resume-section" key="skills">
        <h2>{t('preview.skills')}</h2>
        <p className="resume-skills">{skillList.join(' · ')}</p>
      </section>
    ),
    languages: () => resume.languages?.length > 0 && (
      <section className="resume-section" key="languages">
        <h2>{t('preview.languages')}</h2>
        <ul className="resume-languages">
          {resume.languages.map((lang, i) => (
            <li key={i}>
              <strong>{lang.name}</strong>
              {lang.level && <span> — {lang.level}</span>}
            </li>
          ))}
        </ul>
      </section>
    ),
    interests: () => interestList.length > 0 && (
      <section className="resume-section" key="interests">
        <h2>{t('preview.interests')}</h2>
        <p className="resume-skills">{interestList.join(' · ')}</p>
      </section>
    ),
  };

  // Sections in order, filtered to visible only
  const orderedSections = (resume.sectionsConfig || [])
    .filter((s) => s.visible)
    .map((s) => sections[s.id]?.())
    .filter(Boolean);

  return (
    <div className="resume-doc-wrapper" style={{ maxWidth: `${dims.w}mm` }}>
      <article
        ref={docRef}
        className={`resume-doc resume-${template}`}
        data-page-size={pageSize}
        style={{ minHeight: `${dims.h}mm` }}
        aria-label="Resume preview"
      >
        <header className="resume-header">
          <h1 className="resume-name">{resume.personal.name || ' '}</h1>
          {resume.personal.headline && (
            <p className="resume-headline">{resume.personal.headline}</p>
          )}
          <ul className="resume-contact">
            {resume.personal.email && <li>{resume.personal.email}</li>}
            {resume.personal.phone && <li>{resume.personal.phone}</li>}
            {resume.personal.location && <li>{resume.personal.location}</li>}
            {resume.personal.website && <li>{resume.personal.website}</li>}
            {resume.personal.linkedin && <li>{resume.personal.linkedin}</li>}
            {resume.personal.github && <li>{resume.personal.github}</li>}
          </ul>
        </header>

        {orderedSections}
      </article>

      {/* Page break visualizer */}
      {pages > 1 &&
        Array.from({ length: pages - 1 }, (_, i) => (
          <div
            key={i}
            className="resume-page-break-line"
            style={{ top: `${dims.h * (i + 1)}mm` }}
            aria-hidden="true"
          >
            <span className="page-break-label">Page {i + 2}</span>
          </div>
        ))}
    </div>
  );
}

export default ResumeDocument;
