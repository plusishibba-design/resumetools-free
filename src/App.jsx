import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import HomeHero from './components/HomeHero';
import './App.css';

const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const BuilderMode = lazy(() => import('./components/BuilderMode'));
const DraftsPage = lazy(() => import('./components/DraftsPage'));

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'zh', label: '中文' },
];

function AppInner() {
  const [page, setPage] = useState(null);
  const [pathname, setPathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const { t, lang, setLang } = useLanguage();

  const validPages = ['builder', 'drafts', 'about', 'privacy', 'terms', 'contact'];

  function getRouteFromPath() {
    const path = window.location.pathname.replace(/^\//, '');
    if (validPages.includes(path)) return { page: path };
    return { page: null };
  }

  useEffect(() => {
    const route = getRouteFromPath();
    setPage(route.page);
    setPathname(window.location.pathname);
    updateCanonical();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPath();
      setPage(route.page);
      setPathname(window.location.pathname);
      updateCanonical();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal-on-scroll observer (Studio T. Ishi signature)
  useEffect(() => {
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          intersectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    const observeAll = () => {
      document
        .querySelectorAll('[data-reveal]:not(.is-visible)')
        .forEach((el) => intersectionObserver.observe(el));
    };

    observeAll();
    const mutationObserver = new MutationObserver(() => observeAll());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const safety = setTimeout(() => {
      document
        .querySelectorAll('[data-reveal]:not(.is-visible)')
        .forEach((el) => el.classList.add('is-visible'));
    }, 1500);

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
      clearTimeout(safety);
    };
  }, []);

  const isHomePath = pathname === '/' && page === null;

  function updateCanonical() {
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = window.location.origin + window.location.pathname;
  }

  const navigateTo = (path) => {
    window.history.pushState(null, '', '/' + path);
    if (validPages.includes(path)) {
      setPage(path);
    }
    setPathname('/' + path);
    updateCanonical();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    window.history.pushState(null, '', '/');
    setPage(null);
    setPathname('/');
    updateCanonical();
  };

  const renderPage = () => {
    switch (page) {
      case 'builder': return <BuilderMode />;
      case 'drafts': return <DraftsPage onOpen={() => navigateTo('builder')} />;
      case 'about': return <AboutPage />;
      case 'privacy': return <PrivacyPolicy />;
      case 'terms': return <TermsOfService />;
      case 'contact': return <ContactPage />;
      default: return null;
    }
  };

  // Builder gets a wider layout (no max-width container)
  const containerStyle = page === 'builder'
    ? { padding: '10px 20px 20px', maxWidth: 1400, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }
    : { padding: '10px 20px 20px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' };

  return (
    <div className="app-container" style={containerStyle}>
      <header className="app-header no-print">
        <div className="app-brand">
          <h1 onClick={goHome}>
            <img src="/images/studio-mark.png" alt="" className="brand-mark" loading="lazy" />
            Resume <em>Tools</em>
          </h1>
          <p className="app-tagline">{t('app.subtitle')}</p>
        </div>
        <nav className="app-nav">
          <a href="/builder" onClick={(e) => { e.preventDefault(); navigateTo('builder'); }} className={page === 'builder' ? 'active' : ''}>
            {t('nav.builder')}
          </a>
          <a href="/drafts" onClick={(e) => { e.preventDefault(); navigateTo('drafts'); }} className={page === 'drafts' ? 'active' : ''}>
            {t('nav.drafts')}
          </a>
          <a href="/about" onClick={(e) => { e.preventDefault(); navigateTo('about'); }} className={page === 'about' ? 'active' : ''}>
            {t('nav.about')}
          </a>
          <a href="/contact" onClick={(e) => { e.preventDefault(); navigateTo('contact'); }} className={page === 'contact' ? 'active' : ''}>
            {t('nav.contact')}
          </a>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 4, border: '1px solid var(--color-rule)',
              fontSize: 12, cursor: 'pointer', background: 'var(--color-paper)',
              fontFamily: 'var(--font-mono)', color: 'var(--color-ink-soft)',
              letterSpacing: '0.05em'
            }}
            aria-label="Language"
          >
            {LANGS.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </nav>
      </header>

      <div style={{ flex: 1 }}>
        {page ? (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--color-ink-soft)' }}>{t('common.loading')}</div>}>
            {renderPage()}
          </Suspense>
        ) : isHomePath ? (
          <HomeHero
            onStart={() => navigateTo('builder')}
            onAboutClick={() => navigateTo('about')}
          />
        ) : null}
      </div>

      <footer className="app-footer no-print">
        <div className="footer-links">
          <a href="/about" onClick={(e) => { e.preventDefault(); navigateTo('about'); }}>{t('footer.about')}</a>
          <a href="/privacy" onClick={(e) => { e.preventDefault(); navigateTo('privacy'); }}>{t('footer.privacy')}</a>
          <a href="/terms" onClick={(e) => { e.preventDefault(); navigateTo('terms'); }}>{t('footer.terms')}</a>
          <a href="/contact" onClick={(e) => { e.preventDefault(); navigateTo('contact'); }}>{t('footer.contact')}</a>
        </div>
        <p>{t('footer.tagline')}</p>
        <p>
          {t('footer.sister')}{' '}
          <a href="https://www.imagetools-free.com/" target="_blank" rel="noopener noreferrer">{t('footer.sisterImage')}</a>
          {' · '}
          <a href="https://www.pdftools-free.com/" target="_blank" rel="noopener noreferrer">{t('footer.sisterPdf')}</a>
          {' · '}
          <a href="https://www.calctools-free.com/" target="_blank" rel="noopener noreferrer">{t('footer.sisterCalc')}</a>
          {' · '}
          <a href="https://tetsu-ishi-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">{t('footer.portfolio')}</a>
        </p>
        <p>&copy; {t('footer.copyright')}</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
