import React, { useState } from 'react';

// Single-text or multiline input with a label and optional hint underneath.
export function Field({ label, value, onChange, multiline, rows = 2, type = 'text', hint }) {
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

// Section wrapper with optional reorder + visibility controls in the legend.
export function FieldSet({ title, children, visible, onToggle, onMoveUp, onMoveDown, t }) {
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

// Repeatable list block — each child item gets ↑/↓/Remove controls at the top.
export function RepeatBlock({ children, idx, count, onMove, onRemove, t }) {
  return (
    <div className="repeat-block">
      <div className="repeat-block-controls">
        <button type="button" className="fs-ctrl"
          onClick={() => onMove(-1)} disabled={idx === 0} aria-label="Move up">↑</button>
        <button type="button" className="fs-ctrl"
          onClick={() => onMove(+1)} disabled={idx === count - 1} aria-label="Move down">↓</button>
        <button type="button" className="remove-btn-inline" onClick={onRemove}>
          {t('builder.removeBtn')}
        </button>
      </div>
      {children}
    </div>
  );
}

// Month/year picker with a fallback to free-text for non-standard formats.
export function DateField({ label, value, onChange, disabled, picker = 'month' }) {
  const isStructured = picker === 'month'
    ? /^\d{4}-\d{2}$/.test(value || '')
    : /^\d{4}-\d{2}-\d{2}$/.test(value || '');
  const [useText, setUseText] = useState(!isStructured && !!value);

  return (
    <div className="builder-field">
      <label>{label}</label>
      {useText ? (
        <input type="text" value={value || ''} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={picker === 'month' ? 'e.g. Jan 2020' : 'YYYY-MM-DD'} />
      ) : (
        <input type={picker} value={isStructured ? value : ''} disabled={disabled}
          onChange={(e) => onChange(e.target.value)} />
      )}
      <button type="button" className="field-toggle"
        onClick={() => setUseText((u) => !u)}>
        {useText ? '📅 Use picker' : 'abc Use text'}
      </button>
    </div>
  );
}
