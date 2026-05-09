import React from 'react';
import { useLanguage } from '../../LanguageContext';
import EditorialOrnament from '../EditorialOrnament';

const PRINCIPLES = [
  { num: '01', titleKey: 'about.principle1Title', bodyKey: 'about.principle1Body' },
  { num: '02', titleKey: 'about.principle2Title', bodyKey: 'about.principle2Body' },
  { num: '03', titleKey: 'about.principle3Title', bodyKey: 'about.principle3Body' },
  { num: '04', titleKey: 'about.principle4Title', bodyKey: 'about.principle4Body' },
];

const HOW_STEPS = [
  { numKey: '01', textKey: 'about.how1' },
  { numKey: '02', textKey: 'about.how2' },
  { numKey: '03', textKey: 'about.how3' },
];

function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="editorial-page">
      <div className="editorial-page-inner">
        {/* Hero */}
        <div className="about-hero">
          <div className="about-hero-text" data-reveal>
            <p className="meta-stamp" style={{ marginBottom: '1rem' }}>
              <span>STUDIO T. ISHI</span>
              <span className="sep">·</span>
              <span>ABOUT</span>
            </p>
            <h1 className="editorial-title">
              {t('about.titleSerif')}
              <br />
              <em>{t('about.titleEm')}</em>
            </h1>
            <p className="editorial-lede">{t('about.lede')}</p>
          </div>
          <figure className="about-hero-figure">
            <img src="/images/about-hero.png" alt="" loading="lazy" />
          </figure>
        </div>
        <EditorialOrnament />

        {/* Why we built this */}
        <article className="prose" data-reveal>
          <h2>{t('about.whyTitle')}</h2>
          <p>{t('about.whyP1')}</p>
          <p>{t('about.whyP2')}</p>
        </article>

        {/* Principles - card grid */}
        <section className="editorial-section" style={{ marginTop: '3rem' }} data-reveal>
          <div className="editorial-inner">
            <p className="eyebrow">{t('about.principlesEyebrow')}</p>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>
              {t('about.principlesTitle')}
            </h2>
            <div className="editorial-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {PRINCIPLES.map((p) => (
                <div key={p.num} className="editorial-card">
                  <span className="num">{p.num}</span>
                  <h3>{t(p.titleKey)}</h3>
                  <p>{t(p.bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to use it */}
        <article className="prose" style={{ marginTop: '3rem' }} data-reveal>
          <h2>{t('about.howTitle')}</h2>
          <p>{t('about.howIntro')}</p>
          <ol>
            {HOW_STEPS.map((s) => (
              <li key={s.numKey}>{t(s.textKey)}</li>
            ))}
          </ol>
        </article>

        {/* Tech */}
        <article className="prose" data-reveal>
          <h2>{t('about.techTitle')}</h2>
          <p>{t('about.techP1')}</p>
          <ul>
            <li>{t('about.tech1')}</li>
            <li>{t('about.tech2')}</li>
            <li>{t('about.tech3')}</li>
            <li>{t('about.tech4')}</li>
          </ul>
          <p>{t('about.techP2')}</p>
        </article>

        {/* The maker */}
        <article className="prose" data-reveal>
          <h2>{t('about.makerTitle')}</h2>
          <p>{t('about.makerP1')}</p>
          <p>{t('about.makerP2')}</p>
        </article>

        {/* Why free */}
        <article className="prose" data-reveal>
          <h2>{t('about.freeTitle')}</h2>
          <p>{t('about.freeP1')}</p>
          <p>{t('about.freeP2')}</p>
        </article>

        {/* Closing card */}
        <section
          className="editorial-section editorial-section--paper"
          style={{ marginTop: '3.5rem', textAlign: 'center' }}
          data-reveal
        >
          <div className="editorial-narrow">
            <p className="eyebrow">{t('about.closingEyebrow')}</p>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>
              {t('about.closingTitle')}
            </h2>
            <p style={{ color: 'var(--color-ink-soft)', maxWidth: '50ch', margin: '0 auto 2rem' }}>
              {t('about.closingBody')}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              <a href="/privacy">{t('footer.privacy')}</a>
              <a href="/terms">{t('footer.terms')}</a>
              <a href="/contact">{t('footer.contact')}</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
