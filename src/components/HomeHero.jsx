import React from 'react';
import { useLanguage } from '../LanguageContext';
import { LETTER_TYPE_META } from '../lib/defaultLetters';

const TOOLS = [
  {
    slug: 'resume',
    nameKey: 'home.tool.resume.name',
    descKey: 'home.tool.resume.desc',
    icon: '☷',
  },
  ...Object.entries(LETTER_TYPE_META).map(([slug, meta]) => ({
    slug: slug,
    nameKey: meta.nameKey,
    descKey: meta.descKey,
    icon: meta.icon,
  })),
];

const STRENGTHS = [
  { titleKey: 'home.strength1Title', bodyKey: 'home.strength1Body' },
  { titleKey: 'home.strength2Title', bodyKey: 'home.strength2Body' },
  { titleKey: 'home.strength3Title', bodyKey: 'home.strength3Body' },
];

function HomeHero({ onSelect, onAboutClick }) {
  const { t } = useLanguage();

  return (
    <section className="home-hero">
      <p className="meta-stamp" style={{ marginBottom: '1.5rem' }} data-reveal>
        <span>STUDIO T. ISHI</span>
        <span className="sep">·</span>
        <span>CAREER TOOLS</span>
        <span className="sep">·</span>
        <span>SAIGON</span>
      </p>

      <div className="home-hero-layout home-hero-tools">
        <div className="home-hero-text" data-reveal>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h2 className="editorial-title">
            {t('home.titleSerif')}
            <br />
            <em>{t('home.titleEm')}</em>
          </h2>
          <p className="editorial-lede">{t('home.lede')}</p>
          <button className="cta-ghost" onClick={onAboutClick}>
            {t('home.learnCta')}
          </button>
        </div>

        <div className="home-hero-grid" data-reveal>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            {t('home.toolsEyebrow')}
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: '0.95rem', color: 'var(--color-ink-soft)',
            marginBottom: '1rem', maxWidth: '40ch',
          }}>
            {t('home.toolsBody')}
          </p>
          <div className="tool-grid">
            {TOOLS.map((tool, i) => (
              <button
                key={tool.slug}
                type="button"
                className="tool-card"
                onClick={() => onSelect(tool.slug)}
                aria-label={t(tool.nameKey)}
              >
                <span className="tool-num">
                  <span className="tool-icon">{tool.icon}</span>
                  {' '}
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="tool-name">{t(tool.nameKey)}</h3>
                <p className="tool-desc">{t(tool.descKey)}</p>
                <span className="tool-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-strengths" data-reveal>
        {STRENGTHS.map((s, i) => (
          <div key={i} className="item">
            <h4>{t(s.titleKey)}</h4>
            <p>{t(s.bodyKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeHero;
