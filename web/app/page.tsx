'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AIPanel from '@/components/AIPanel';
import PersonCard, { effectiveAge, type PersonState } from '@/components/PersonCard';
import ResultView from '@/components/ResultView';
import Stars from '@/components/Stars';
import { compute, type MatchResult } from '@/lib/score';
import { drawPoster, posterFileName } from '@/lib/poster';

const NOW = new Date().getFullYear();

const DEFAULT_A: PersonState = { sign: null, gender: null, mode: 'age', age: 26, year: NOW - 26 };
const DEFAULT_B: PersonState = { sign: null, gender: null, mode: 'age', age: 24, year: NOW - 24 };

export default function Home() {
  const [a, setA] = useState<PersonState>(DEFAULT_A);
  const [b, setB] = useState<PersonState>(DEFAULT_B);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [toast, setToast] = useState('');
  const [shake, setShake] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);

  const start = () => {
    if (a.sign === null || b.sign === null) {
      setShake(true);
      setTimeout(() => setShake(false), 420);
      showToast('请先为双方都选择一个星座 ✦');
      return;
    }

    setResult(
      compute(
        { sign: a.sign, age: effectiveAge(a), gender: a.gender },
        { sign: b.sign, age: effectiveAge(b), gender: b.gender }
      )
    );
  };

  const again = () => setResult(null);

  const save = () => {
    if (!result) return;
    const canvas = drawPoster(result);
    const link = document.createElement('a');
    link.download = posterFileName(result);
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('海报已生成，快去分享吧 ✨');
  };

  return (
    <>
      <Stars />

      <div className="app">
        <header className="hero-head">
          <div className="brand">
            <span>✦</span> SIGN MATCH
          </div>
          <h1>
            你们的星座，<em>配吗？</em>
          </h1>
          <p className="lead">选择两个人的星座与年龄 · 一秒揭晓恋人 / 夫妻 / 朋友契合度</p>
        </header>

        {result === null ? (
          <section className={shake ? 'shake' : ''}>
            <div className="duo">
              <PersonCard person="a" label="TA" value={a} onChange={setA} />
              <div className="mid-vs">VS</div>
              <PersonCard person="b" label="我" value={b} onChange={setB} />
            </div>

            <div className="cta-wrap">
              <button className="cta" onClick={start}>
                ✦ 开始速配 ✦
              </button>
              <p className="hint">纯娱乐 · 无需注册 · 不留痕</p>
            </div>
          </section>
        ) : (
          <>
            <ResultView result={result} />
            <AIPanel result={result} />

            <div className="actions">
              <button className="btn primary" onClick={save}>
                💾 保存为图片
              </button>
              <button className="btn ghost" onClick={again}>
                ↻ 重新测试
              </button>
            </div>
          </>
        )}

        <footer className="foot">
          本结果仅供娱乐 · 基于太阳星座的趣味规则引擎 · 非科学占星
        </footer>
      </div>

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </>
  );
}
