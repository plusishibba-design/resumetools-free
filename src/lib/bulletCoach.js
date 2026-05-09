// Bullet quality analysis — used by the live coaching badges in Experience.
//
// Heuristics (validated by common resume guides):
// - Sweet spot: 8-25 words per bullet
// - First word should be a strong action verb
// - At least one quantified metric (%, $, count) makes it stand out
// - Avoid weak phrases like "worked on", "responsible for"

// ~250 strong action verbs commonly recommended in resume guides.
const ACTION_VERBS = new Set([
  // Leadership
  'led', 'managed', 'directed', 'supervised', 'oversaw', 'coordinated', 'orchestrated',
  'spearheaded', 'pioneered', 'championed', 'mentored', 'trained', 'guided',
  // Building / shipping
  'built', 'designed', 'developed', 'created', 'engineered', 'launched', 'shipped',
  'delivered', 'implemented', 'deployed', 'released', 'introduced', 'established',
  'founded', 'rebuilt', 'redesigned', 'refactored', 'architected', 'prototyped',
  // Improvement
  'improved', 'optimized', 'streamlined', 'automated', 'accelerated', 'reduced',
  'eliminated', 'cut', 'increased', 'doubled', 'tripled', 'boosted', 'lifted',
  'grew', 'scaled', 'expanded', 'enhanced', 'upgraded', 'modernized',
  // Analysis
  'analyzed', 'evaluated', 'assessed', 'investigated', 'researched', 'audited',
  'diagnosed', 'measured', 'tracked', 'monitored', 'forecast', 'modeled',
  // Communication
  'presented', 'pitched', 'negotiated', 'persuaded', 'convinced', 'communicated',
  'authored', 'wrote', 'edited', 'published', 'reported',
  // Problem solving
  'solved', 'resolved', 'fixed', 'debugged', 'troubleshot', 'identified',
  'discovered', 'uncovered', 'recognized', 'addressed', 'tackled',
  // Collaboration
  'partnered', 'collaborated', 'liaised', 'consulted', 'advised',
  // Others commonly used
  'shipped', 'owned', 'drove', 'transformed', 'turned', 'standardized',
  'consolidated', 'integrated', 'migrated', 'transitioned',
  'won', 'secured', 'closed', 'generated', 'sourced',
  'taught', 'educated', 'coached', 'facilitated',
  'planned', 'executed', 'implemented', 'completed', 'achieved', 'reached',
  'reduced', 'minimized', 'maximized',
  'recruited', 'hired', 'onboarded',
  'tested', 'validated', 'verified', 'qualified',
]);

const WEAK_PHRASES = [
  'worked on',
  'helped with',
  'helped to',
  'responsible for',
  'in charge of',
  'tasked with',
  'involved in',
  'participated in',
  'assisted with',
  'assisted in',
  'contributed to',
  'duties included',
  'duties involved',
  'familiar with',
  'experience with',
  'experience in',
  'i was',
  'we were',
];

const METRIC_PATTERNS = [
  /\d+\s*%/,                       // 38%
  /\$\s*\d/,                       // $1000
  /\d+[.,]?\d*\s*(k|m|b)\b/i,      // 5k, 1.2M, 3B
  /\d+\s*(million|thousand|billion)/i,
  /\d+\s*(users?|customers?|clients?|teams?|engineers?|designers?|hours?|days?|weeks?|months?|years?)/i,
  /\d+x\b/i,                       // 3x
  /\d+\+/,                         // 40+
  /\d+\s*(%|percent)/i,
];

function stripBoldMarks(s) {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

export function analyzeBullet(line) {
  const text = stripBoldMarks(String(line || '')).trim();
  if (!text) {
    return null; // empty bullet, no analysis
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // First-word verb check (strip non-alpha leading)
  const firstWord = (words[0] || '').toLowerCase().replace(/[^a-z]/g, '');
  const isActionVerb = ACTION_VERBS.has(firstWord);

  // Metric / number check
  const hasMetric = METRIC_PATTERNS.some((re) => re.test(text));

  // Weak phrase detection
  const lower = text.toLowerCase();
  const weakPhrase = WEAK_PHRASES.find((p) => lower.includes(p));

  // Sweet spot: 8-25 words. Below 8 = too short, above 30 = too long.
  let lengthStatus = 'ok';
  if (wordCount < 8) lengthStatus = 'short';
  else if (wordCount > 30) lengthStatus = 'long';

  return {
    text,
    wordCount,
    lengthStatus,
    isActionVerb,
    firstWord,
    hasMetric,
    weakPhrase: weakPhrase || null,
  };
}

export function analyzeBulletsBlock(blockText) {
  return String(blockText || '')
    .split('\n')
    .map((line) => ({ line, analysis: analyzeBullet(line) }))
    .filter((r) => r.analysis); // drop blank lines
}
