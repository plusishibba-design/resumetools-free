import React from 'react';

function TermsOfService() {
  return (
    <div className="editorial-page">
      <div className="editorial-page-inner">
        <p className="meta-stamp" style={{ marginBottom: '1rem' }} data-reveal>
          <span>STUDIO T. ISHI</span>
          <span className="sep">·</span>
          <span>TERMS</span>
        </p>
        <h1 className="editorial-title" data-reveal>
          Terms of <em>Service</em>
        </h1>
        <p className="editorial-meta" data-reveal>Last updated: 2026-05-08</p>

        <article className="prose" data-reveal style={{ marginTop: '2rem' }}>
          <p>
            Welcome to Career Tools. By using this website, you agree to the terms below. If you
            do not agree, please do not use the site.
          </p>

          <h2>Not career or legal advice</h2>
          <p>
            Career Tools provides resume formatting tools. The output is not career, employment,
            legal, or tax advice. We do not guarantee that any specific resume will pass any
            specific applicant tracking system (ATS) or land any specific interview.
          </p>

          <h2>Accuracy</h2>
          <p>
            The builder simply renders the content you type into a print-ready layout. You are
            responsible for the accuracy of every fact you put on your resume.
          </p>

          <h2>No warranty</h2>
          <p>
            The site is provided "as is" without warranty of any kind. We are not liable for any
            loss, damage, or claim arising from your use of the builder or any decision made based
            on its output.
          </p>

          <h2>Acceptable use</h2>
          <p>
            You agree not to attempt to disrupt the site, scrape it abusively, reverse-engineer
            ads, or use it in any way that violates applicable law.
          </p>

          <h2>Intellectual property</h2>
          <p>
            The site design, code, and content are owned by Studio T. Ishi unless otherwise noted.
            Your resume content remains yours — we make no claim to it. You may freely use the
            builder for your own personal or business purposes, but you may not republish the
            site\'s design or code as your own.
          </p>

          <h2>Third-party services</h2>
          <p>
            We embed services from Google (Analytics, AdSense, Fonts). Their respective terms
            govern your interaction with those services.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms from time to time. The "Last updated" date at the top
            reflects the most recent revision. Continued use after a revision constitutes
            acceptance.
          </p>

          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of the operator\'s home jurisdiction (Vietnam),
            without regard to conflict of law principles.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these terms, write to{' '}
            <a href="mailto:aamujou1@gmail.com">aamujou1@gmail.com</a>.
          </p>
        </article>
      </div>
    </div>
  );
}

export default TermsOfService;
