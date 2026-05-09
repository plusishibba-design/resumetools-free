// Letter type definitions, metadata, and default sample content for the
// career-document hub. Each type renders through the same LetterBuilder /
// LetterDocument pair, only the defaults and labels differ.

export const LETTER_TYPES = [
  'cover-letter',
  'resignation',
  'thank-you',
  'reference',
  'negotiation',
];

// Per-type metadata. Default body strings use [Bracketed] placeholders so
// users immediately see what to swap in.
export const LETTER_TYPE_META = {
  'cover-letter': {
    route: '/cover-letter',
    nameKey: 'letter.coverLetter.name',
    titleKey: 'letter.coverLetter.title',
    descKey: 'letter.coverLetter.desc',
    icon: '✉',
    defaults: {
      subject: 'Application for [Position]',
      greeting: 'Dear Hiring Manager,',
      body:
        'I am writing to express my strong interest in the [Position] role at [Company]. With [X] years of experience in [field], I am excited about the opportunity to contribute to your team.\n\nIn my current role at [Current Company], I have [key accomplishment with metric]. I bring a strong track record of [skill 1], [skill 2], and [skill 3] that aligns with what you are seeking.\n\nI would welcome the chance to discuss how my background can support [Company]\'s goals. My resume is attached for your review and I look forward to hearing from you.\n\nThank you for your consideration.',
      closing: 'Sincerely,',
    },
  },
  'resignation': {
    route: '/resignation',
    nameKey: 'letter.resignation.name',
    titleKey: 'letter.resignation.title',
    descKey: 'letter.resignation.desc',
    icon: '↗',
    defaults: {
      subject: 'Notice of Resignation',
      greeting: 'Dear [Manager Name],',
      body:
        'Please accept this letter as formal notice of my resignation from my position as [Role] at [Company], effective [Last Day — typically 2 weeks from today].\n\nThis decision was not easy. I am grateful for the opportunities for growth you have provided, particularly [specific example]. I have learned a great deal during my time here.\n\nI am committed to a smooth transition over the next [N] weeks. I will wrap up current projects and document ongoing work to support my successor.\n\nThank you again for the opportunity to work with you and the team.',
      closing: 'Sincerely,',
    },
  },
  'thank-you': {
    route: '/thank-you',
    nameKey: 'letter.thankYou.name',
    titleKey: 'letter.thankYou.title',
    descKey: 'letter.thankYou.desc',
    icon: '♥',
    defaults: {
      subject: 'Thank you for the interview',
      greeting: 'Dear [Interviewer Name],',
      body:
        'Thank you for taking the time to meet with me [today / on Date] to discuss the [Position] role at [Company]. I enjoyed our conversation, particularly [specific topic that came up].\n\nThe role sounds like an excellent match for my experience in [skill / area], and I am even more enthusiastic about it after our discussion. The team\'s approach to [aspect of the work] resonates strongly with how I like to operate.\n\nPlease let me know if there is any additional information I can provide. I look forward to next steps.',
      closing: 'Best regards,',
    },
  },
  'reference': {
    route: '/reference',
    nameKey: 'letter.reference.name',
    titleKey: 'letter.reference.title',
    descKey: 'letter.reference.desc',
    icon: '★',
    defaults: {
      subject: 'Request for a reference',
      greeting: 'Dear [Reference Name],',
      body:
        'I hope this message finds you well. I am applying for [Position] at [Company / Program] and would be honored if you would consider serving as a reference for me.\n\nWe worked together at [Past Company] from [Year] to [Year], where I [brief reminder of working relationship and accomplishments]. The role I am applying for involves [key responsibilities], and your perspective on my [relevant strengths] would be especially valuable.\n\nIf you are willing, the deadline is [Date]. I am happy to share my updated resume, the job description, and any other context to make this as easy as possible for you.\n\nThank you so much for considering this.',
      closing: 'With gratitude,',
    },
  },
  'negotiation': {
    route: '/negotiation',
    nameKey: 'letter.negotiation.name',
    titleKey: 'letter.negotiation.title',
    descKey: 'letter.negotiation.desc',
    icon: '⚖',
    defaults: {
      subject: 'Re: Offer for [Position]',
      greeting: 'Dear [Hiring Manager Name],',
      body:
        'Thank you for the offer to join [Company] as [Position]. I am genuinely excited about the opportunity and the work we discussed.\n\nBefore finalizing, I would like to discuss the compensation package. Based on my [X] years of experience in [field], the value I can bring to [specific outcome], and current market data for similar roles in [location], I would like to request a base salary of [Amount].\n\nI am open to discussing the structure — base, bonus, equity, or signing — to find a package that works for both of us. To be clear: I am committed to joining [Company] and view this as a collaborative conversation.\n\nThank you again for the offer and for your willingness to discuss. I look forward to your thoughts.',
      closing: 'Best regards,',
    },
  },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function buildDefaultLetter(letterType, prefilledSender = {}) {
  const meta = LETTER_TYPE_META[letterType];
  if (!meta) throw new Error(`Unknown letter type: ${letterType}`);

  return {
    type: 'letter',
    letterType,
    letter: {
      sender: {
        name: '',
        email: '',
        phone: '',
        address: '',
        ...prefilledSender,
      },
      recipient: { name: '', title: '', company: '', address: '' },
      date: todayISO(),
      subject: meta.defaults.subject,
      greeting: meta.defaults.greeting,
      body: meta.defaults.body,
      closing: meta.defaults.closing,
      signature: prefilledSender.name || '',
    },
    template: 'formal',
    pageSize: 'a4',
  };
}
