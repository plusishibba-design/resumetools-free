import React from 'react';
import { ACCENT_PRESETS } from '../../lib/analysis/accentColors';

// Shared toolbar used by both ResumeBuilder and LetterBuilder. `templates`
// is an array of { id, labelKey } pairs so each builder controls its own
// i18n keys without relying on a fragile prefix-concat scheme.
export default function BuilderToolbar({
  t,
  templates,
  template,
  onTemplate,
  pageSize,
  onPageSize,
  accentId,
  onAccent,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onPrint,
  onExportPdf,
  onExportDocx,
  exportingPdf,
  exportingDocx,
}) {
  return (
    <div className="builder-toolbar">
      <div className="builder-template-picker">
        <span className="picker-label">{t('builder.templateLabel')}</span>
        <div className="picker-buttons">
          {templates.map((tmpl) => (
            <button key={tmpl.id} type="button"
              className={`picker-btn ${template === tmpl.id ? 'is-active' : ''}`}
              onClick={() => onTemplate(tmpl.id)}>
              {t(tmpl.labelKey)}
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
              onClick={() => onPageSize(size)}>
              {t(`builder.pageSize${size === 'a4' ? 'A4' : 'Letter'}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-template-picker">
        <span className="picker-label">{t('builder.accentLabel')}</span>
        <div className="accent-chips">
          {ACCENT_PRESETS.map((p) => (
            <button key={p.id} type="button"
              className={`accent-chip ${accentId === p.id ? 'is-active' : ''}`}
              style={{ background: p.deep, borderColor: p.deep }}
              onClick={() => onAccent(p.id)}
              aria-label={t(`builder.accent.${p.id}`)}
              title={t(`builder.accent.${p.id}`)}
            />
          ))}
        </div>
      </div>

      <div className="builder-actions">
        <button type="button" className="cta-ghost"
          onClick={onUndo} disabled={!canUndo}
          title={t('builder.undoHint')}>
          ↶ {t('builder.undoBtn')}
        </button>
        <button type="button" className="cta-ghost"
          onClick={onRedo} disabled={!canRedo}
          title={t('builder.redoHint')}>
          ↷ {t('builder.redoBtn')}
        </button>
        <button type="button" className="cta-ghost" onClick={onReset}>
          {t('builder.resetBtn')}
        </button>
        <button type="button" className="cta-ghost" onClick={onPrint}>
          {t('builder.printBtn')}
        </button>
        <button type="button" className="cta-ghost"
          onClick={onExportDocx} disabled={exportingDocx}>
          {exportingDocx ? t('builder.exportingDocx') : t('builder.docxBtn')}
        </button>
        <button type="button" className="cta-ghost"
          onClick={onExportPdf} disabled={exportingPdf}>
          {exportingPdf ? t('builder.exportingPdf') : t('builder.pdfBtn')}
        </button>
      </div>
    </div>
  );
}
