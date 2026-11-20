'use client';

import { useEffect, useRef } from 'react';

const ITEM_H = 44;

interface Props {
  values: number[];
  value: number;
  unit: string;
  /** 模式切换时用它触发重新定位（不要用 value，否则滚动会打架） */
  resetKey: string;
  onChange: (v: number) => void;
}

/** 滚轮选择器：scroll-snap + 固定行高，选中项居中 */
export default function WheelPicker({ values, value, unit, resetKey, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // 只在模式或取值范围变化时重新定位，避免滚动过程中被拽回去
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const idx = Math.max(0, values.indexOf(valueRef.current));
    list.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleScroll = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const list = listRef.current;
      if (!list) return;
      const i = Math.max(0, Math.min(values.length - 1, Math.round(list.scrollTop / ITEM_H)));
      const next = values[i];
      if (next !== valueRef.current) onChange(next);
    }, 90);
  };

  const pick = (v: number) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: values.indexOf(v) * ITEM_H, behavior: 'smooth' });
    onChange(v);
  };

  return (
    <div className="picker">
      <div className="pk-fade top" />
      <div className="pk-list" ref={listRef} onScroll={handleScroll}>
        {values.map(v => (
          <div
            key={v}
            className={`pk-item${v === value ? ' on' : ''}`}
            onClick={() => pick(v)}
          >
            {v}
            <span>{unit}</span>
          </div>
        ))}
      </div>
      <div className="pk-fade bottom" />
      <div className="pk-frame" />
    </div>
  );
}
