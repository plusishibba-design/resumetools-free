// Browser SpeechSynthesis wrapper — reads the rendered resume content.

function pickVoice(lang) {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  const langCode = lang === 'ja' ? 'ja' : lang === 'vi' ? 'vi' : lang === 'zh' ? 'zh' : lang === 'id' ? 'id' : 'en';
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(langCode + '-')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langCode)) ||
    voices.find((v) => v.default) ||
    voices[0]
  );
}

function stripBold(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

export function buildResumeNarration(resume, t) {
  const lines = [];
  const p = resume.personal || {};
  if (p.name) lines.push(p.name + '.');
  if (p.headline) lines.push(p.headline + '.');

  const contactBits = [p.email, p.phone, p.location].filter(Boolean);
  if (contactBits.length) {
    lines.push(`Contact: ${contactBits.join(', ')}.`);
  }

  const visible = (resume.sectionsConfig || []).filter((s) => s.visible).map((s) => s.id);

  if (visible.includes('summary') && resume.summary) {
    lines.push(`${t('preview.summary')}.`, stripBold(resume.summary));
  }

  if (visible.includes('experience') && resume.experiences?.length) {
    lines.push(`${t('preview.experience')}.`);
    for (const e of resume.experiences) {
      const head = [e.role, e.company].filter(Boolean).join(' at ');
      const dates = [e.start, e.current ? 'Present' : e.end].filter(Boolean).join(' to ');
      lines.push(`${head}${dates ? ', ' + dates : ''}.`);
      if (e.bullets) {
        for (const b of e.bullets.split('\n').filter(Boolean)) {
          lines.push(stripBold(b));
        }
      }
    }
  }

  if (visible.includes('education') && resume.educations?.length) {
    lines.push(`${t('preview.education')}.`);
    for (const e of resume.educations) {
      lines.push(
        [e.degree, e.school].filter(Boolean).join(', ') +
          (e.start || e.end ? ', ' + [e.start, e.end].filter(Boolean).join(' to ') : '') + '.'
      );
    }
  }

  if (visible.includes('certifications') && resume.certifications?.length) {
    lines.push(`${t('preview.certifications')}.`);
    for (const c of resume.certifications) {
      lines.push([c.name, c.issuer, c.date].filter(Boolean).join(', ') + '.');
    }
  }

  if (visible.includes('projects') && resume.projects?.length) {
    lines.push(`${t('preview.projects')}.`);
    for (const proj of resume.projects) {
      lines.push([proj.name, proj.dates].filter(Boolean).join(', ') + '.');
      if (proj.description) lines.push(stripBold(proj.description));
    }
  }

  if (visible.includes('awards') && resume.awards?.length) {
    lines.push(`${t('preview.awards')}.`);
    for (const a of resume.awards) {
      lines.push([a.name, a.issuer, a.date].filter(Boolean).join(', ') + '.');
    }
  }

  if (visible.includes('volunteer') && resume.volunteer?.length) {
    lines.push(`${t('preview.volunteer')}.`);
    for (const v of resume.volunteer) {
      lines.push([v.role, v.organization, v.dates].filter(Boolean).join(', ') + '.');
      if (v.description) lines.push(stripBold(v.description));
    }
  }

  if (visible.includes('skills')) {
    const groups = Array.isArray(resume.skills) ? resume.skills : [];
    if (groups.some((g) => g.items)) {
      lines.push(`${t('preview.skills')}.`);
      for (const g of groups) {
        if (!g.items) continue;
        const items = g.items.split(',').map((s) => s.trim()).filter(Boolean).join(', ');
        lines.push(g.category ? `${g.category}: ${items}.` : items + '.');
      }
    }
  }

  if (visible.includes('languages') && resume.languages?.length) {
    lines.push(`${t('preview.languages')}.`);
    for (const l of resume.languages) {
      lines.push([l.name, l.level].filter(Boolean).join(', ') + '.');
    }
  }

  if (visible.includes('interests') && resume.interests) {
    lines.push(`${t('preview.interests')}.`);
    lines.push(resume.interests);
  }

  return lines.join(' ');
}

export function buildLetterNarration(letter) {
  const lines = [];
  if (letter.sender?.name) lines.push(letter.sender.name + '.');
  if (letter.date) lines.push(letter.date + '.');
  const recipient = [letter.recipient?.name, letter.recipient?.title, letter.recipient?.company]
    .filter(Boolean).join(', ');
  if (recipient) lines.push(recipient + '.');
  if (letter.subject) lines.push(`Subject: ${letter.subject}.`);
  if (letter.greeting) lines.push(letter.greeting);
  if (letter.body) {
    for (const p of String(letter.body).split('\n\n')) {
      const clean = stripBold(p.trim());
      if (clean) lines.push(clean);
    }
  }
  if (letter.closing) lines.push(letter.closing);
  if (letter.signature) lines.push(letter.signature);
  return lines.join(' ');
}

export class ResumeNarrator {
  constructor(lang = 'en') {
    this.lang = lang;
    this.utterance = null;
    this.onEndCb = null;
  }

  setOnEnd(cb) {
    this.onEndCb = cb;
  }

  isSupported() {
    return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  speak(text) {
    if (!this.isSupported()) return false;
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(this.lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1.0;
    u.onend = () => {
      this.utterance = null;
      this.onEndCb?.();
    };
    this.utterance = u;
    speechSynthesis.speak(u);
    return true;
  }

  pause() {
    if (this.isSupported()) speechSynthesis.pause();
  }

  resume() {
    if (this.isSupported()) speechSynthesis.resume();
  }

  stop() {
    if (this.isSupported()) {
      speechSynthesis.cancel();
      this.utterance = null;
    }
  }

  isSpeaking() {
    return this.isSupported() && speechSynthesis.speaking;
  }

  isPaused() {
    return this.isSupported() && speechSynthesis.paused;
  }
}
