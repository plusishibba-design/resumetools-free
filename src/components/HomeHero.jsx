import React from 'react';
import { useLanguage } from '../LanguageContext';

const STRENGTHS = [
  { titleKey: 'home.strength1Title', bodyKey: 'home.strength1Body' },
  { titleKey: 'home.strength2Title', bodyKey: 'home.strength2Body' },
  { titleKey: 'home.strength3Title', bodyKey: 'home.strength3Body' },
];

function HomeHero({ onStart, onAboutClick }) {
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

      <div className="home-hero-layout home-hero-resume">
        <div className="home-hero-text" data-reveal>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h2 className="editorial-title">
            {t('home.titleSerif')}
            <br />
            <em>{t('home.titleEm')}</em>
          </h2>
          <p className="editorial-lede">{t('home.lede')}</p>
          <div className="home-cta">
            <button className="cta-primary" onClick={onStart}>
              {t('home.startCta')}
            </button>
            <button className="cta-ghost" onClick={onAboutClick}>
              {t('home.learnCta')}
            </button>
          </div>
        </div>

        <div className="home-hero-mock" data-reveal aria-hidden="true">
          {/* Decorative resume mock — visual only */}
          <div className="resume-mock">
            <div className="mock-line mock-name" />
            <div className="mock-line mock-headline" />
            <div className="mock-line mock-contact" />
            <div className="mock-spacer" />
            <div className="mock-line mock-h2" />
            <div className="mock-line mock-body" />
            <div className="mock-line mock-body short" />
            <div className="mock-spacer" />
            <div className="mock-line mock-h2" />
            <div className="mock-line mock-entry" />
            <div className="mock-line mock-body" />
            <div className="mock-line mock-body short" />
            <div className="mock-line mock-entry" />
            <div className="mock-line mock-body" />
            <div className="mock-line mock-body short" />
            <div className="mock-spacer" />
            <div className="mock-line mock-h2" />
            <div className="mock-line mock-body" />
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
