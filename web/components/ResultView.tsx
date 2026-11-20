'use client';

import { useEffect, useState } from 'react';
import { EL_NAME, levelOf } from '@/lib/zodiac';
import type { MatchResult } from '@/lib/score';

const RING_R = 52;
const CIRC = 2 * Math.PI * RING_R;

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    let raf = 0;
    const start = performance.now() + delay;

    const step = (t: number) => {
      if (t < start) {
        raf = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}

interface Props {
  result: MatchResult;
}

export default function ResultView({ result }: Props) {
  const overall = useCountUp(result.overall, 1200, 120);
  const couple = useCountUp(result.couple.score, 1000, 200);
  const spouse = useCountUp(result.spouse.score, 1000, 320);
  const friend = useCountUp(result.friend.score, 1000, 440);

  const [ring, setRing] = useState(CIRC);
  const [bars, setBars] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setRing(CIRC * (1 - result.overall / 100));
      setBars(true);
    }, 80);
    return () => clearTimeout(t);
  }, [result.overall]);

  const cards = [
    {
      key: 'couple',
      cls: 'couple',
      icon: '💞',
      name: '恋人',
      data: result.couple,
      value: couple
    },
    {
      key: 'spouse',
      cls: 'spouse',
      icon: '💍',
      name: '夫妻',
      data: result.spouse,
      value: spouse
    },
    {
      key: 'friend',
      cls: 'friend',
      icon: '🤝',
      name: '朋友',
      data: result.friend,
      value: friend
    }
  ];

  const traits = [
    { z: result.a, age: result.ageA },
    { z: result.b, age: result.ageB }
  ];

  return (
    <section className="result-view">
      <div className="result-top panel">
        <div className="rt-eyebrow">综合契合指数</div>
        <div className="rt-main">
          <div className="rt-sign">
            <div className="rt-sym">{result.a.symbol}</div>
            <div className="rt-name">{result.a.name}</div>
            <div className="rt-meta">
              {EL_NAME[result.a.element]} · {result.ageA}岁
            </div>
          </div>

          <div className="rt-ring">
            <svg viewBox="0 0 120 120">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FFD36E" />
                  <stop offset="1" stopColor="#FF7EB6" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="60" cy="60" r={RING_R} />
              <circle
                className="ring-fg"
                cx="60"
                cy="60"
                r={RING_R}
                strokeDasharray={CIRC}
                strokeDashoffset={ring}
              />
            </svg>
            <div className="rt-score">
              <b>{overall}</b>
              <small>FIT</small>
            </div>
          </div>

          <div className="rt-sign">
            <div className="rt-sym">{result.b.symbol}</div>
            <div className="rt-name">{result.b.name}</div>
            <div className="rt-meta">
              {EL_NAME[result.b.element]} · {result.ageB}岁
            </div>
          </div>
        </div>
        <div className="rt-verdict">{result.verdict}</div>
      </div>

      <div className="rel-grid">
        {cards.map(c => (
          <article key={c.key} className={`rel-card panel ${c.cls}`}>
            <div className="rel-head">
              <span className="rel-ic">{c.icon}</span>
              <span className="rel-name">{c.name}</span>
              <span className="rel-level">{levelOf(c.data.score)}</span>
            </div>
            <div className="rel-score">
              <b>{c.value}</b>
              <span>分</span>
            </div>
            <div className="rel-bar">
              <i style={{ width: bars ? `${c.data.score}%` : '0%' }} />
            </div>
            <p className="rel-text">{c.data.text}</p>
          </article>
        ))}
      </div>

      <div className="traits-panel panel">
        <div className="tp-title">性格速览</div>
        <div className="tp-grid">
          {traits.map(({ z }) => (
            <div className="tp-card" key={z.name}>
              <div className="tp-head">
                <span className="sym">{z.symbol}</span>
                <b>{z.name}</b>
                <span className="el">{EL_NAME[z.element]}</span>
              </div>
              <div className="tp-tags">
                {z.traits.map(t => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <p>{z.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
