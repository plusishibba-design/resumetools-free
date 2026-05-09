// Lazy-loaded DOCX exporter for letter documents.
// Uses the same docx library as the resume exporter.

function parseBold(text) {
  if (!text) return [];
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return { text: p.slice(2, -2), bold: true };
    }
    return { text: p };
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

const COLOR_INK = '1A1614';
const COLOR_INK_SOFT = '5A4F48';

export async function exportLetterToDocx(letter, lang, filename = 'letter.docx') {
  const docxLib = await import('docx');
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = docxLib;

  const para = (parts, opts = {}) =>
    new Paragraph({
      ...opts,
      children: parts.map((p) =>
        new TextRun({
          text: p.text,
          bold: p.bold || opts.boldAll || false,
          italics: p.italic || false,
          color: p.color || COLOR_INK_SOFT,
          size: p.size || 22,
          font: 'Calibri',
        })
      ),
    });

  const children = [];

  // Sender block
  if (letter.sender.name) {
    children.push(
      para([{ text: letter.sender.name, bold: true, color: COLOR_INK, size: 22 }],
        { spacing: { after: 40 } })
    );
  }
  if (letter.sender.address) {
    children.push(para([{ text: letter.sender.address, size: 20 }], { spacing: { after: 40 } }));
  }
  const contactBits = [letter.sender.email, letter.sender.phone].filter(Boolean);
  if (contactBits.length) {
    children.push(para([{ text: contactBits.join(' · '), size: 20 }], { spacing: { after: 240 } }));
  }

  // Date
  if (letter.date) {
    children.push(
      para([{ text: formatDate(letter.date, lang), size: 22, color: COLOR_INK }],
        { spacing: { after: 240 } })
    );
  }

  // Recipient block
  const recipLines = [
    letter.recipient.name,
    letter.recipient.title,
    letter.recipient.company,
    letter.recipient.address,
  ].filter(Boolean);
  recipLines.forEach((line, i) => {
    children.push(
      para([{ text: line, size: 22, color: COLOR_INK }],
        { spacing: { after: i === recipLines.length - 1 ? 240 : 40 } })
    );
  });

  // Subject
  if (letter.subject) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({ text: 'Re: ', bold: true, size: 22, color: COLOR_INK, font: 'Calibri' }),
          new TextRun({ text: letter.subject, size: 22, color: COLOR_INK, font: 'Calibri' }),
        ],
      })
    );
  }

  // Greeting
  if (letter.greeting) {
    children.push(
      para([{ text: letter.greeting, size: 22, color: COLOR_INK }],
        { spacing: { after: 240 } })
    );
  }

  // Body paragraphs
  const bodyParas = String(letter.body || '').split('\n\n').filter((p) => p.trim());
  bodyParas.forEach((p) => {
    children.push(
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: parseBold(p).map((r) =>
          new TextRun({ text: r.text, bold: r.bold, size: 22, color: COLOR_INK_SOFT, font: 'Calibri' })
        ),
      })
    );
  });

  // Closing + signature
  if (letter.closing) {
    children.push(
      para([{ text: letter.closing, size: 22, color: COLOR_INK }],
        { spacing: { after: 480 } })
    );
  }
  if (letter.signature) {
    children.push(
      para([{ text: letter.signature, bold: true, size: 22, color: COLOR_INK }])
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
