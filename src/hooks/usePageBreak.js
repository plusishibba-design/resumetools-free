import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';

const MM_TO_PX = 3.7795;

// Smart page-break hook: walks the document tree, finds elements that would
// straddle an A4 / Letter boundary, and inserts spacer divs to push them onto
// the next page. Mirrors the print engine's page-break-inside: avoid behaviour
// in the on-screen preview so what you see equals the PDF.
//
// Usage:
//   const { docRef, pages } = usePageBreak({
//     pageHeightMm: 297,
//     deps: [resume, template, pageSize],
//     breakableSelector: '.resume-section, .resume-section > .resume-entry',
//     onPageCount,
//   });
//   <article ref={docRef}>...</article>
export default function usePageBreak({
  pageHeightMm,
  deps,
  breakableSelector,
  onPageCount,
}) {
  const docRef = useRef(null);
  const [pages, setPages] = useState(1);
  const pageHeightPx = pageHeightMm * MM_TO_PX;

  const adjust = useCallback(() => {
    const el = docRef.current;
    if (!el) return;

    for (let pass = 0; pass < 50; pass++) {
      el.querySelectorAll('[data-page-spacer]').forEach((s) => s.remove());
      const breakables = el.querySelectorAll(breakableSelector);
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
  }, [pageHeightPx, breakableSelector, onPageCount]);

  // Run after every relevant data mutation
  useLayoutEffect(() => {
    adjust();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjust, ...(deps || [])]);

  // Catch font-load resizes etc., debounced
  useEffect(() => {
    const el = docRef.current;
    if (!el) return;
    let timeoutId;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(adjust, 80);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [adjust]);

  // Cleanup spacers on unmount
  useEffect(() => {
    return () => {
      if (docRef.current) {
        docRef.current.querySelectorAll('[data-page-spacer]').forEach((s) => s.remove());
      }
    };
  }, []);

  return { docRef, pages };
}
