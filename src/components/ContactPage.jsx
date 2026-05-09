import React from 'react';
import { useLanguage } from '../LanguageContext';
import EditorialOrnament from './EditorialOrnament';

const EMAIL = 'aamujou1@gmail.com';
const SITE_PREFIX = '[Career Tools]';

const CATEGORIES = [
  {
    titleKey: 'contact.cat1Title',
    descKey: 'contact.cat1Body',
    subject: `${SITE_PREFIX} General Inquiry`,
    body:
      'Hi,\n\nI wanted to ask about\n\n\n\nThanks',
  },
  {
    titleKey: 'contact.cat2Title',
    descKey: 'contact.cat2Body',
    subject: `${SITE_PREFIX} Bug Report`,
    body:
      'Calculator: \nBrowser / OS: \n\nInputs:\n- (list values you entered)\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected: \nActual: ',
  },
  {
    titleKey: 'contact.cat3Title',
    descKey: 'contact.cat3Body',
    subject: `${SITE_PREFIX} Feature Suggestion`,
    body:
      "Hi,\n\nI'd like to suggest:\n\n\n\nUse case:\n\n\nWhy it would help:",
  },
  {
    titleKey: 'contact.cat4Title',
    descKey: 'contact.cat4Body',
    subject: `${SITE_PREFIX} Studio / Business`,
    body:
      "Hi,\n\nI'd like to discuss:\n\n\n\nMy organization:\n\nProposed scope:",
  },
];

function buildMailto(subject, body) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="editorial-page">
      <div className="editorial-page-inner">
        {/* Hero */}
        <div className="contact-hero">
          <div className="contact-hero-text" data-reveal>
            <p className="meta-stamp" style={{ marginBottom: '1rem' }}>
              <span>STUDIO T. ISHI</span>
              <span className="sep">·</span>
              <span>CONTACT</span>
            </p>
            <h1 className="editorial-title">
              {t('contact.titleSerif')}
              <br />
              <em>{t('contact.titleEm')}</em>
            </h1>
            <p className="editorial-lede">{t('contact.lede')}</p>
          </div>
          <figure className="contact-hero-figure">
            <img src="/images/contact-hero.png" alt="" loading="lazy" />
          </figure>
        </div>
        <EditorialOrnament />

        {/* Direct email */}
        <div className="contact-direct" style={{ marginBottom: '2.5rem' }} data-reveal>
          <span className="label">{t('contact.directLabel')}</span>
          <a className="email" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </div>

        {/* Categories */}
        <article className="prose" data-reveal>
          <h2>{t('contact.categoriesTitle')}</h2>
          <p>{t('contact.categoriesIntro')}</p>
        </article>

        <div className="contact-cards" data-reveal>
          {CATEGORIES.map((c, i) => (
            <a
              key={i}
              className="contact-card"
              href={buildMailto(c.subject, c.body)}
            >
              <h3>{t(c.titleKey)}</h3>
              <p>{t(c.descKey)}</p>
              <span className="contact-card-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>

        {/* Response time */}
        <article className="prose" style={{ marginTop: '3rem' }} data-reveal>
          <h2>{t('contact.responseTitle')}</h2>
          <p>{t('contact.responseBody')}</p>
        </article>

        {/* Privacy */}
        <article className="prose" data-reveal>
          <h2>{t('contact.privacyTitle')}</h2>
          <p>{t('contact.privacyBody')}</p>
        </article>
      </div>
    </div>
  );
}

export default ContactPage;
