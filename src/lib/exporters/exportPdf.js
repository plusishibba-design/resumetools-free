// Lazy-loaded PDF exporter via html2pdf.js (html2canvas + jsPDF wrapper).
// Generates a PDF download without opening the browser print dialog.

export async function exportToPdf({ element, filename = 'resume.pdf', pageSize = 'a4' }) {
  if (!element) throw new Error('Resume element not found');
  const html2pdf = (await import('html2pdf.js')).default;

  const format = pageSize === 'letter' ? 'letter' : 'a4';

  const options = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      // Clean up the cloned DOM before rendering: drop preview-only chrome
      onclone: (_clonedDoc, clonedEl) => {
        // Remove the visual page-break overlay lines and JS-injected spacers
        clonedEl
          .querySelectorAll('.resume-page-break-line, [data-page-spacer]')
          .forEach((el) => el.remove());
        // Strip preview-only shadow on the document itself
        const doc = clonedEl.querySelector('.resume-doc') || clonedEl;
        if (doc) {
          doc.style.boxShadow = 'none';
          doc.style.margin = '0';
          // Reset min-height so content can flow naturally for paging
          doc.style.minHeight = '0';
        }
      },
    },
    jsPDF: {
      unit: 'mm',
      format,
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  await html2pdf().set(options).from(element).save();
}
