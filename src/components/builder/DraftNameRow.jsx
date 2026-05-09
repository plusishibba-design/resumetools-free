import React, { useState } from 'react';

export default function DraftNameRow({ name, onChange, typeLabel, typeIcon, t }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  // Keep local value in sync if name prop changes externally
  React.useEffect(() => { setValue(name); }, [name]);

  const commit = () => {
    if (value.trim() && value.trim() !== name) onChange(value.trim());
    setEditing(false);
  };

  return (
    <div className="builder-draft-row">
      {editing ? (
        <input type="text" className="draft-name-edit"
          value={value} autoFocus
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setValue(name); setEditing(false); }
          }} />
      ) : (
        <h2 className="draft-name-display"
          onClick={() => setEditing(true)}
          title={t('builder.renameHint')}>
          {name}
          <span className="rename-icon" aria-hidden="true">✎</span>
        </h2>
      )}
      {typeLabel && (
        <p className="draft-type-label">
          {typeIcon && <span className="ux-toggle-icon">{typeIcon}</span>}
          {typeIcon && ' '}
          {typeLabel}
        </p>
      )}
    </div>
  );
}
