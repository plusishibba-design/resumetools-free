// Default sample resume — used to seed new drafts and the very first draft.

export const DEFAULT_SECTIONS_CONFIG = [
  { id: 'summary', visible: true },
  { id: 'experience', visible: true },
  { id: 'education', visible: true },
  { id: 'certifications', visible: true },
  { id: 'projects', visible: true },
  { id: 'awards', visible: true },
  { id: 'volunteer', visible: false },
  { id: 'skills', visible: true },
  { id: 'languages', visible: true },
  { id: 'interests', visible: false },
];

export const DEFAULT_RESUME = {
  personal: {
    name: 'Mai Nguyen',
    headline: 'Senior Product Designer',
    email: 'mai@example.com',
    phone: '+84 90 123 4567',
    location: 'Ho Chi Minh City',
    website: 'mainguyen.design',
    linkedin: 'linkedin.com/in/mainguyen',
    github: 'github.com/mainguyen',
    photo: '', // base64 data URL or ''
  },
  summary:
    'Product designer with 8 years of experience leading end-to-end design for B2B SaaS and consumer fintech. Strong systems thinker who pairs editorial craft with rigorous UX research.',
  experiences: [
    {
      role: 'Senior Product Designer',
      company: 'Atlas Studio',
      location: 'Ho Chi Minh City',
      start: '2022-01',
      end: '',
      current: true,
      bullets:
        'Led the redesign of the core dashboard, reducing time-to-first-action by **38%**.\nManaged a team of 3 designers and partnered with **12 engineers** across 4 squads.\nDefined the design system that now serves **14 products** across the company.',
    },
    {
      role: 'Product Designer',
      company: 'Lotus Bank',
      location: 'Ho Chi Minh City',
      start: '2019-03',
      end: '2021-12',
      current: false,
      bullets:
        'Designed the mobile onboarding flow that lifted activation by **22%**.\nShipped the first Vietnamese-language banking app meeting **WCAG AA** contrast.\nResearched and documented **40+ user interviews** with small-business owners.',
    },
  ],
  educations: [
    {
      degree: 'B.A. Visual Communication',
      school: 'Hanoi University of Industrial Fine Arts',
      location: 'Hanoi',
      start: '2013',
      end: '2017',
    },
  ],
  certifications: [
    {
      name: 'Certified Scrum Master',
      issuer: 'Scrum Alliance',
      date: '2023',
      credentialId: 'CSM-12345',
    },
  ],
  projects: [
    {
      name: 'Lotus — Open-source Design System',
      description: 'An 80-component design system released under MIT, used by 500+ teams.',
      link: 'github.com/mainguyen/lotus',
      dates: '2022 — Present',
    },
  ],
  awards: [
    { name: 'Vietnam UX Awards — Gold', issuer: 'Vietnam UX Society', date: '2024' },
  ],
  volunteer: [
    {
      role: 'Mentor',
      organization: 'ADPList',
      dates: '2021 — Present',
      description:
        'Mentored 40+ designers from underrepresented backgrounds in 1:1 portfolio reviews.',
    },
  ],
  // skills can be a string (legacy) OR an array of { category, items } groups
  skills: [
    { category: 'Design', items: 'Product Design, UX Research, Prototyping, Accessibility' },
    { category: 'Tools', items: 'Figma, Notion, Linear, GitHub' },
    { category: 'Specialties', items: 'Design Systems, Editorial Layout, Mobile-first' },
  ],
  languages: [
    { name: 'Vietnamese', level: 'Native' },
    { name: 'English', level: 'Fluent' },
    { name: 'Japanese', level: 'B1' },
  ],
  interests:
    'Editorial typography, vintage cameras, Vietnamese coffee culture, weekend long-distance running',
  sectionsConfig: DEFAULT_SECTIONS_CONFIG,
};

export const DEFAULT_DRAFT_BODY = {
  resume: DEFAULT_RESUME,
  template: 'classic',
  pageSize: 'a4',
};
