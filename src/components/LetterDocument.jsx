import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';

const PAGE_DIMS = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};
const MM_TO_PX = 3.7795;

// Render **bold** segments without injecting raw HTML
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
  const docRef = useRef(null);
  const [pages, setPages] = useState(1);
  const dims = PAGE_DIMS[pageSize] || PAGE_DIMS.a4;
  const pageHeightPx = dims.h * MM_TO_PX;

  const adjustPageBreaks = useCallback(() => {
    const el = docRef.current;
    if (!el) return;

    for (let pass = 0; pass < 50; pass++) {
      el.querySelectorAll('[data-page-spacer]').forEach((s) => s.remove());
      const breakables = el.querySelectorAll(
        '.letter-block, .letter-body p'
      );
      let changed = false;
      for (const elem of breakables) {
        const top = elem.offsetTop;
        const height = elem.offsetHeight;
        if (height === 0 || height >= pageHeightPx - 20) continue;
        const topPage = Math.floor(top / pageHeightPx);
        const bottomPage = Math.floor((top + height - 1) / pageHeightPx);
        if (topPage !== bottomPage) {
          const nextPageStart = (topPage + 1) * pageHeightPx;
          const spacer = document.createElement('div');
          spacer.dataset.pageSpacer = 'true';
          spacer.style.height = `${nextPageStart - top}px`;
          spacer.setAttribute('aria-hidden', 'true');
          elem.parentNode.insertBefore(spacer, elem);
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }

    const newHeight = el.scrollHeight;
    const n = Math.max(1, Math.ceil((newHeight - 1) / pageHeightPx));
    setPages(n);
    onPageCount?.(n);
  }, [pageHeightPx, onPageCount]);

  useLayoutEffect(() => {
    adjustPageBreaks();
  }, [letter, template, pageSize, adjustPageBreaks]);

  useEffect(() => {
    const el = docRef.current;
    if (!el) return;
    let timeoutId;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => adjustPageBreaks(), 80);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [adjustPageBreaks]);

  useEffect(() => {
    return () => {
      if (docRef.current) {
        docRef.current.querySelectorAll('[data-page-spacer]').forEach((s) => s.remove());
      }
    };
  }, []);

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
        {/* Sender (top-right or top-left depending on template) */}
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

        {/* Date */}
        {letter.date && (
          <p className="letter-block letter-date">{formatDate(letter.date, lang)}</p>
        )}

        {/* Recipient block */}
        {(letter.recipient.name || letter.recipient.company || letter.recipient.address) && (
          <div className="letter-block letter-recipient">
            {letter.recipient.name && <p>{letter.recipient.name}</p>}
            {letter.recipient.title && <p>{letter.recipient.title}</p>}
            {letter.recipient.company && <p>{letter.recipient.company}</p>}
            {letter.recipient.address && <p>{letter.recipient.address}</p>}
          </div>
        )}

        {/* Subject / Re: line */}
        {letter.subject && (
          <p className="letter-block letter-subject">
            <strong>Re:</strong> {letter.subject}
          </p>
        )}

        {/* Greeting */}
        {letter.greeting && (
          <p className="letter-block letter-greeting">{letter.greeting}</p>
        )}

        {/* Body paragraphs */}
        <div className="letter-body">
          {bodyParas.map((p, i) => (
            <p key={i}>{renderBold(p)}</p>
          ))}
        </div>

        {/* Closing + signature */}
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
