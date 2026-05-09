// Lazy-loaded DOCX exporter. Calling exportToDocx() dynamically imports
// the docx package so it's not in the initial bundle.

import { formatDateRange } from './formatDate';

const COLOR_INK = '1A1614';
const COLOR_INK_SOFT = '5A4F48';
const COLOR_CLAY_DEEP = 'A8704C';

// Convert a string with **bold** segments into an array of TextRun specs.
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

export async function exportToDocx(resume, t, filename = 'resume.docx') {
  const docxLib = await import('docx');
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    LevelFormat,
  } = docxLib;

  const make = (parts, opts = {}) =>
    new Paragraph({
      ...opts,
      children: parts.map((p) =>
        new TextRun({
          text: p.text,
          bold: p.bold || opts.boldAll || false,
          italics: p.italic || false,
          color: p.color,
          size: p.size,
          font: p.font || 'Calibri',
        })
      ),
    });

  const sections = resume.sectionsConfig.filter((s) => s.visible);

  const sectionHeading = (label) =>
    new Paragraph({
      spacing: { before: 240, after: 100 },
      border: {
        bottom: { color: 'D8D1C2', space: 1, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: label.toUpperCase(),
          bold: true,
          size: 20,
          characterSpacing: 30,
          color: COLOR_INK,
          font: 'Calibri',
        }),
      ],
    });

  const entryTitle = (title) =>
    new Paragraph({
      spacing: { before: 120, after: 0 },
      children: [
        new TextRun({
          text: title || '',
          bold: true,
          size: 22,
          color: COLOR_INK,
          font: 'Calibri',
        }),
      ],
    });

  const entryMetaAndDates = (meta, dates) =>
    new Paragraph({
      spacing: { after: 60 },
      tabStops: [{ type: 'right', position: 9020 }],
      children: [
        new TextRun({ text: meta || '', size: 19, color: COLOR_INK_SOFT, font: 'Calibri' }),
        new TextRun({ text: '\t', font: 'Calibri' }),
        new TextRun({ text: dates || '', size: 18, color: COLOR_CLAY_DEEP, font: 'Consolas' }),
      ],
    });

  const bulletsFromText = (text) => {
    if (!text) return [];
    return text.split('\n').filter(Boolean).map((line) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        indent: { left: 360 },
        children: parseBold(line).map((r) =>
          new TextRun({ text: r.text, bold: r.bold, size: 20, font: 'Calibri', color: COLOR_INK_SOFT })
        ),
      })
    );
  };

  const children = [];

  // === Header ===
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: resume.personal.name || '',
          bold: true,
          size: 44,
          color: COLOR_INK,
          font: 'Calibri',
        }),
      ],
    })
  );

  if (resume.personal.headline) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: resume.personal.headline,
            italics: true,
            size: 24,
            color: COLOR_CLAY_DEEP,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  const contactBits = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.website,
    resume.personal.linkedin,
    resume.personal.github,
  ].filter(Boolean);

  if (contactBits.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        border: {
          bottom: { color: 'D8D1C2', space: 4, style: BorderStyle.SINGLE, size: 4 },
        },
        children: [
          new TextRun({
            text: contactBits.join(' · '),
            size: 18,
            color: COLOR_INK_SOFT,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // === Sections ===
  for (const cfg of sections) {
    switch (cfg.id) {
      case 'summary': {
        if (!resume.summary) break;
        children.push(sectionHeading(t('preview.summary')));
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: parseBold(resume.summary).map((r) =>
              new TextRun({ text: r.text, bold: r.bold, size: 20, color: COLOR_INK_SOFT, font: 'Calibri' })
            ),
          })
        );
        break;
      }
      case 'experience': {
        if (!resume.experiences?.length) break;
        children.push(sectionHeading(t('preview.experience')));
        for (const exp of resume.experiences) {
          children.push(entryTitle(exp.role));
          children.push(
            entryMetaAndDates(
              [exp.company, exp.location].filter(Boolean).join(' · '),
              formatDateRange(exp.start, exp.end)
            )
          );
          children.push(...bulletsFromText(exp.bullets));
        }
        break;
      }
      case 'education': {
        if (!resume.educations?.length) break;
        children.push(sectionHeading(t('preview.education')));
        for (const edu of resume.educations) {
          children.push(entryTitle(edu.degree));
          children.push(
            entryMetaAndDates(
              [edu.school, edu.location].filter(Boolean).join(' · '),
              [edu.start, edu.end].filter(Boolean).join(' — ')
            )
          );
        }
        break;
      }
      case 'certifications': {
        if (!resume.certifications?.length) break;
        children.push(sectionHeading(t('preview.certifications')));
        for (const c of resume.certifications) {
          children.push(entryTitle(c.name));
          children.push(
            entryMetaAndDates(
              [c.issuer, c.credentialId].filter(Boolean).join(' · '),
              c.date
            )
          );
        }
        break;
      }
      case 'projects': {
        if (!resume.projects?.length) break;
        children.push(sectionHeading(t('preview.projects')));
        for (const p of resume.projects) {
          children.push(entryTitle(p.name));
          children.push(entryMetaAndDates(p.link || '', p.dates));
          if (p.description) {
            children.push(
              new Paragraph({
                spacing: { after: 80 },
                children: parseBold(p.description).map((r) =>
                  new TextRun({ text: r.text, bold: r.bold, size: 20, color: COLOR_INK_SOFT, font: 'Calibri' })
                ),
              })
            );
          }
        }
        break;
      }
      case 'awards': {
        if (!resume.awards?.length) break;
        children.push(sectionHeading(t('preview.awards')));
        for (const a of resume.awards) {
          children.push(entryTitle(a.name));
          children.push(entryMetaAndDates(a.issuer, a.date));
        }
        break;
      }
      case 'volunteer': {
        if (!resume.volunteer?.length) break;
        children.push(sectionHeading(t('preview.volunteer')));
        for (const v of resume.volunteer) {
          children.push(entryTitle(v.role));
          children.push(entryMetaAndDates(v.organization, v.dates));
          if (v.description) {
            children.push(
              new Paragraph({
                spacing: { after: 80 },
                children: parseBold(v.description).map((r) =>
                  new TextRun({ text: r.text, bold: r.bold, size: 20, color: COLOR_INK_SOFT, font: 'Calibri' })
                ),
              })
            );
          }
        }
        break;
      }
      case 'skills': {
        const groups = Array.isArray(resume.skills)
          ? resume.skills
          : (resume.skills ? [{ category: '', items: resume.skills }] : []);
        if (groups.length === 0 || groups.every((g) => !g.items)) break;
        children.push(sectionHeading(t('preview.skills')));
        for (const g of groups) {
          if (!g.items) continue;
          const labelPart = g.category ? `${g.category}: ` : '';
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                ...(g.category
                  ? [new TextRun({ text: labelPart, bold: true, size: 20, color: COLOR_INK, font: 'Calibri' })]
                  : []),
                new TextRun({
                  text: g.items.split(',').map((s) => s.trim()).filter(Boolean).join(' · '),
                  size: 20,
                  color: COLOR_INK_SOFT,
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
        break;
      }
      case 'languages': {
        if (!resume.languages?.length) break;
        children.push(sectionHeading(t('preview.languages')));
        const text = resume.languages
          .filter((l) => l.name)
          .map((l) => (l.level ? `${l.name} — ${l.level}` : l.name))
          .join(' · ');
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text, size: 20, color: COLOR_INK_SOFT, font: 'Calibri' }),
            ],
          })
        );
        break;
      }
      case 'interests': {
        if (!resume.interests) break;
        children.push(sectionHeading(t('preview.interests')));
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: resume.interests.split(',').map((s) => s.trim()).filter(Boolean).join(' · '),
                size: 20,
                color: COLOR_INK_SOFT,
                font: 'Calibri',
              }),
            ],
          })
        );
        break;
      }
      default:
        break;
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 1080, bottom: 900, left: 1080 },
          },
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
