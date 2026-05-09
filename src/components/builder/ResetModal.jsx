import React from 'react';

export default function ResetModal({ open, onCancel, onConfirm, t }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop no-print"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{t('builder.resetModalTitle')}</h3>
        <p>{t('builder.resetModalBody')}</p>
        <div className="modal-actions">
          <button type="button" className="cta-ghost" onClick={onCancel}>
            {t('builder.cancelBtn')}
          </button>
          <button type="button" className="cta-primary" onClick={onConfirm}>
            {t('builder.confirmResetBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
