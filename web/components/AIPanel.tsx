'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ZODIACS } from '@/lib/zodiac';
import { parseStream, type RelationKey } from '@/lib/parse';
import type { MatchResult } from '@/lib/score';

type StatusType = '' | 'done' | 'err' | 'warn';

interface Props {
  result: MatchResult;
}

const BASE_KEY: Record<RelationKey, 'couple' | 'spouse' | 'friend'> = {
  COUPLE: 'couple',
  SPOUSE: 'spouse',
  FRIEND: 'friend'
};

const REL_META: { key: RelationKey; icon: string; name: string }[] = [
  { key: 'COUPLE', icon: '💞', name: '恋人' },
  { key: 'SPOUSE', icon: '💍', name: '夫妻' },
  { key: 'FRIEND', icon: '🤝', name: '朋友' }
];

export default function AIPanel({ result }: Props) {
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [full, setFull] = useState('');
  const [model, setModel] = useState('');
  const [think, setThink] = useState(0);
  const [status, setStatus] = useState<{ type: StatusType; text: string }>({
    type: '',
    text: '正在读取两个人的星座…'
  });

  const ctrlRef = useRef<AbortController | null>(null);

  // 换一组匹配时重置
  useEffect(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setStarted(false);
    setRunning(false);
    setFull('');
    setModel('');
    setThink(0);
    setStatus({ type: '', text: '正在读取两个人的星座…' });
  }, [result]);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  const parsed = useMemo(() => parseStream(full), [full]);

  const run = useCallback(async () => {
    if (running) return;

    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setStarted(true);
    setRunning(true);
    setFull('');
    setModel('');
    setThink(0);
    setStatus({ type: '', text: '正在连接 AI…' });

    const base = {
      couple: result.couple.score,
      spouse: result.spouse.score,
      friend: result.friend.score,
      overall: result.overall
    };

    const signA = ZODIACS.findIndex(z => z.name === result.a.name);
    const signB = ZODIACS.findIndex(z => z.name === result.b.name);

    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          a: { sign: signA, age: result.ageA },
          b: { sign: signB, age: result.ageB },
          base
        })
      });

      if (!resp.ok) {
        let msg = `AI 服务返回 ${resp.status}`;
        try {
          const j = await resp.json();
          if (j?.error) msg = j.error;
        } catch {
          /* 忽略非 JSON */
        }
        throw new Error(msg);
      }
      if (!resp.body) throw new Error('当前环境不支持流式读取');

      setStatus({ type: '', text: '正在生成分析…' });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      let got = false;
      let truncated = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          let event = 'message';
          let data = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          if (!data) continue;

          let obj: any;
          try {
            obj = JSON.parse(data);
          } catch {
            continue;
          }

          if (event === 'delta' && typeof obj.t === 'string') {
            if (!got) {
              got = true;
              setStatus({ type: '', text: '正在生成分析…' });
            }
            acc += obj.t;
            setFull(acc);
          } else if (event === 'thinking' && typeof obj.chars === 'number') {
            setThink(obj.chars);
            setStatus({ type: '', text: `AI 正在思考…（已推理 ${obj.chars} 字）` });
          } else if (event === 'done') {
            truncated = obj.truncated === true;
          } else if (event === 'error') {
            throw new Error(obj.message || 'AI 服务异常');
          } else if (event === 'meta' && obj.model) {
            setModel(obj.model);
          }
        }
      }

      if (!got) throw new Error('AI 没有返回内容，请重试');

      setStatus(
        truncated
          ? { type: 'warn', text: '输出达到长度上限，内容可能不完整' }
          : { type: 'done', text: '分析完成 · 内容由 AI 生成，仅供娱乐' }
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'AI 分析失败，请稍后重试'
      });
    } finally {
      if (ctrlRef.current === ctrl) {
        ctrlRef.current = null;
        setRunning(false);
      }
    }
  }, [running, result]);

  const streamingKey = running ? parsed.active : null;

  const renderSectionText = (key: keyof typeof parsed.sections) => {
    const section = parsed.sections[key];
    if (!section) return null;
    return section.text.trim();
  };

  return (
    <div className="ai-panel panel">
      <div className="ai-head">
        <span className="ai-spark">✦</span>
        <div className="ai-head-txt">
          <div className="ai-title">AI 深度解读</div>
          <div className="ai-sub">
            {started && model
              ? `由 ${model} 生成 · 仅供参考`
              : '算法给出结论，AI 讲清为什么'}
          </div>
        </div>
        <button className="ai-btn" onClick={run} disabled={running}>
          {running ? '分析中…' : started ? (status.type === 'err' ? '重试' : '重新分析') : '让 AI 分析'}
        </button>
      </div>

      {started && (
        <>
          <div className={`ai-status ${status.type}`}>
            <span className="dot" />
            <span>{status.text}</span>
          </div>

          {(parsed.sections.A || parsed.sections.B) && (
            <div className="ai-cols">
              {(['A', 'B'] as const).map(key => {
                const z = key === 'A' ? result.a : result.b;
                const text = renderSectionText(key);
                if (text === null) return null;
                return (
                  <div className="ai-sec" key={key}>
                    <div className="ai-sec-h">
                      <span className="ic">{z.symbol}</span>
                      <b>{z.name}</b>
                      <span className="tag">{key === 'A' ? 'TA' : '你'}</span>
                    </div>
                    <p className={streamingKey === key ? 'streaming' : ''}>{text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {REL_META.map(({ key, icon, name }) => {
            const section = parsed.sections[key];
            if (!section) return null;

            const base = result[BASE_KEY[key]].score;
            const score = section.score;
            const diff = score === undefined ? null : score - base;

            return (
              <div className="ai-sec ai-rel" data-sec={key} key={key}>
                <div className="ai-sec-h">
                  <span className="ic">{icon}</span>
                  <b>{name}</b>
                  {diff !== null && (
                    <span className={`ai-diff${diff > 0 ? ' up' : diff < 0 ? ' down' : ''}`}>
                      算法 {base}
                      {diff === 0 ? '' : ` · ${diff > 0 ? '+' : ''}${diff}`}
                    </span>
                  )}
                  <span className="ai-score">
                    <b>{score ?? '—'}</b>
                    <small>分</small>
                  </span>
                </div>
                <p className={streamingKey === key ? 'streaming' : ''}>
                  {section.text.trim()}
                </p>
              </div>
            );
          })}

          {parsed.sections.SUMMARY?.text.trim() && (
            <div className="ai-sec ai-sum">
              <p className={streamingKey === 'SUMMARY' ? 'streaming' : ''}>
                {parsed.sections.SUMMARY.text.trim()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
