import React from 'react';
import usePageBreak from '../../hooks/usePageBreak';

const PAGE_DIMS = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

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

function formatDate(value, lang = 'en') {
  if (!value) return '';
  const v = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  try {
    const locale = lang === 'ja' ? 'ja-JP' : lang === 'vi' ? 'vi-VN' : lang === 'zh' ? 'zh-CN' : lang === 'id' ? 'id-ID' : 'en-US';
    return new Date(v).toLocaleDateString(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return v;
  }
}

function LetterDocument({ letter, template = 'formal', pageSize = 'a4', lang = 'en', onPageCount }) {
  const dims = PAGE_DIMS[pageSize] || PAGE_DIMS.a4;
  const { docRef, pages } = usePageBreak({
    pageHeightMm: dims.h,
    deps: [letter, template, pageSize],
    breakableSelector: '.letter-block, .letter-body p',
    onPageCount,
  });

  const bodyParas = String(letter.body || '').split('\n\n').filter((p) => p.trim());

  return (
    <div className="resume-doc-wrapper" style={{ maxWidth: `${dims.w}mm` }}>
      <article
        ref={docRef}
        className={`resume-doc letter-doc letter-${template}`}
        data-page-size={pageSize}
        style={{ minHeight: `${dims.h}mm` }}
        aria-label="Letter preview"
      >
        <header className="letter-block letter-sender">
          {letter.sender.name && <p className="letter-sender-name">{letter.sender.name}</p>}
          {letter.sender.address && (
            <p className="letter-sender-line">{letter.sender.address}</p>
          )}
          {(letter.sender.email || letter.sender.phone) && (
            <p className="letter-sender-line">
              {[letter.sender.email, letter.sender.phone].filter(Boolean).join(' · ')}
            </p>
          )}
        </header>

        {letter.date && (
          <p className="letter-block letter-date">{formatDate(letter.date, lang)}</p>
        )}

        {(letter.recipient.name || letter.recipient.company || letter.recipient.address) && (
          <div className="letter-block letter-recipient">
            {letter.recipient.name && <p>{letter.recipient.name}</p>}
            {letter.recipient.title && <p>{letter.recipient.title}</p>}
            {letter.recipient.company && <p>{letter.recipient.company}</p>}
            {letter.recipient.address && <p>{letter.recipient.address}</p>}
          </div>
        )}

        {letter.subject && (
          <p className="letter-block letter-subject">
            <strong>Re:</strong> {letter.subject}
          </p>
        )}

        {letter.greeting && (
          <p className="letter-block letter-greeting">{letter.greeting}</p>
        )}

        <div className="letter-body">
          {bodyParas.map((p, i) => (
            <p key={i}>{renderBold(p)}</p>
          ))}
        </div>

        {letter.closing && (
          <p className="letter-block letter-closing">{letter.closing}</p>
        )}
        {letter.signature && (
          <p className="letter-block letter-signature">{letter.signature}</p>
        )}
      </article>

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

export default LetterDocument;
