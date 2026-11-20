'use client';

import { ZODIACS, clamp, type Gender } from '@/lib/zodiac';
import WheelPicker from './WheelPicker';

export type AgeMode = 'age' | 'year';

export interface PersonState {
  sign: number | null;
  gender: Gender | null;
  mode: AgeMode;
  age: number;
  year: number;
}

const NOW = new Date().getFullYear();
const AGE_MIN = 18;
const AGE_MAX = 60;
const YEAR_MIN = NOW - AGE_MAX;
const YEAR_MAX = NOW - AGE_MIN;

const AGES = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

export const effectiveAge = (p: PersonState): number =>
  p.mode === 'age' ? p.age : NOW - p.year;

interface Props {
  person: 'a' | 'b';
  label: string;
  value: PersonState;
  onChange: (next: PersonState) => void;
}

export default function PersonCard({ person, label, value, onChange }: Props) {
  const setSign = (sign: number) => onChange({ ...value, sign });
  const setGender = (g: Gender) =>
    onChange({ ...value, gender: value.gender === g ? null : g });

  const setMode = (mode: AgeMode) => {
    if (mode === value.mode) return;
    if (mode === 'year') {
      onChange({ ...value, mode, year: clamp(NOW - value.age, YEAR_MIN, YEAR_MAX) });
    } else {
      onChange({ ...value, mode, age: clamp(NOW - value.year, AGE_MIN, AGE_MAX) });
    }
  };

  return (
    <article className="person-card" data-p={person}>
      <div className="pc-head">
        <div className="pc-id">
          <span className="pc-idx">{person.toUpperCase()}</span>
          <span className="pc-who">{label}</span>
        </div>
        <div className="seg-gender">
          <button
            type="button"
            className={value.gender === 'male' ? 'on' : ''}
            onClick={() => setGender('male')}
          >
            ♂ 男
          </button>
          <button
            type="button"
            className={value.gender === 'female' ? 'on' : ''}
            onClick={() => setGender('female')}
          >
            ♀ 女
          </button>
        </div>
      </div>

      <div className="pc-label">
        <span>选择星座</span>
        <span className="picked">
          {value.sign === null ? '待选择' : ZODIACS[value.sign].name}
        </span>
      </div>

      <div className="zodiac-grid">
        {ZODIACS.map((z, i) => (
          <button
            key={z.name}
            type="button"
            className={`zbtn${value.sign === i ? ' on' : ''}`}
            onClick={() => setSign(i)}
            aria-label={z.name}
            aria-pressed={value.sign === i}
          >
            <span className="sym">{z.symbol}</span>
            <span className="nm">{z.name.replace('座', '')}</span>
          </button>
        ))}
      </div>

      <div className="age-box">
        <div className="mode-tabs">
          <button
            type="button"
            className={value.mode === 'age' ? 'on' : ''}
            onClick={() => setMode('age')}
          >
            按年龄
          </button>
          <button
            type="button"
            className={value.mode === 'year' ? 'on' : ''}
            onClick={() => setMode('year')}
          >
            按出生年份
          </button>
        </div>

        {value.mode === 'age' ? (
          <WheelPicker
            values={AGES}
            value={value.age}
            unit="岁"
            resetKey={`age-${person}`}
            onChange={age => onChange({ ...value, age })}
          />
        ) : (
          <WheelPicker
            values={YEARS}
            value={value.year}
            unit="年"
            resetKey={`year-${person}`}
            onChange={year => onChange({ ...value, year })}
          />
        )}
      </div>
    </article>
  );
}
