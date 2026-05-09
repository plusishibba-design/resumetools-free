import React from 'react';
import { analyzeBulletsBlock } from '../lib/bulletCoach';

// Live-feedback panel that sits under a bullets textarea.
// Renders one row per non-empty bullet line with quality badges.
function BulletCoach({ value, t }) {
  const items = analyzeBulletsBlock(value);
  if (items.length === 0) return null;

  return (
    <div className="bullet-coach">
      <p className="coach-header">{t('coach.bulletsTitle')}</p>
      <ol className="coach-rows">
        {items.map((row, i) => {
          const a = row.analysis;
          return (
            <li key={i} className="coach-row">
              <span className="coach-num">{i + 1}</span>
              <span className="coach-preview">{a.text.slice(0, 60)}{a.text.length > 60 ? '…' : ''}</span>
              <span className="coach-badges">
                <Badge variant={a.lengthStatus === 'ok' ? 'good' : 'warn'}
                  title={t(`coach.length${a.lengthStatus[0].toUpperCase() + a.lengthStatus.slice(1)}`)}>
                  {a.wordCount}w
                </Badge>
                <Badge variant={a.isActionVerb ? 'good' : 'warn'}
                  title={a.isActionVerb
                    ? t('coach.verbGood').replace('{0}', a.firstWord)
                    : t('coach.verbWarn').replace('{0}', a.firstWord || '?')}>
                  verb
                </Badge>
                <Badge variant={a.hasMetric ? 'good' : 'neutral'}
                  title={a.hasMetric ? t('coach.metricGood') : t('coach.metricMissing')}>
                  metric
                </Badge>
              </span>
              {a.weakPhrase && (
                <span className="coach-weak" title={t('coach.weakHint')}>
                  ⚠ "{a.weakPhrase}"
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Badge({ children, variant = 'neutral', title }) {
  return (
    <span className={`coach-badge coach-badge-${variant}`} title={title}>
      {children}
    </span>
  );
}

export default BulletCoach;
