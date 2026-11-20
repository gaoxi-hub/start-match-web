import {
  ZODIACS, EL_NAME, elementKey, COUPLE_BASE, FRIEND_BASE, ASPECTS,
  hasAspect, clamp, levelOf, textOf, verdictOf,
  type Element, type Gender, type Zodiac
} from './zodiac';

export interface PersonInput {
  sign: number;
  age: number;
  gender?: Gender | null;
}

export interface RelationScore {
  score: number;
  level: string;
  text: string;
}

export interface MatchResult {
  a: Zodiac;
  b: Zodiac;
  ageA: number;
  ageB: number;
  overall: number;
  verdict: string;
  couple: RelationScore;
  spouse: RelationScore;
  friend: RelationScore;
}

const { TRINES, OPPOSITES, SQUARES } = ASPECTS;

const relation = (kind: 'couple' | 'spouse' | 'friend', score: number): RelationScore => ({
  score,
  level: levelOf(score),
  text: textOf(kind, score)
});

export function compute(a: PersonInput, b: PersonInput): MatchResult {
  const za = ZODIACS[a.sign];
  const zb = ZODIACS[b.sign];

  const key = elementKey(za.element, zb.element);
  const same = za.name === zb.name;

  let couple = COUPLE_BASE[key];
  let friend = FRIEND_BASE[key];

  if (same) { couple += 3; friend += 2; }
  if (hasAspect(TRINES, za.name, zb.name)) { couple += 6; friend += 6; }
  if (hasAspect(OPPOSITES, za.name, zb.name)) { couple += 8; friend += 2; }
  if (hasAspect(SQUARES, za.name, zb.name)) { couple -= 6; friend -= 4; }

  const gap = Math.abs(a.age - b.age);
  const penalty = gap <= 3 ? 0 : gap <= 6 ? 2 : gap <= 10 ? 5 : 8;

  couple = clamp(couple - penalty, 35, 98);
  friend = clamp(friend - Math.round(penalty * 0.4), 45, 98);

  const els: Element[] = [za.element, zb.element];
  const stable = els.every(e => e === 'earth' || e === 'water');
  const fiery = els.every(e => e === 'fire' || e === 'air');
  const spouse = clamp(couple + (stable ? 4 : fiery ? -4 : 0), 35, 98);

  const overall = Math.round((couple + spouse + friend) / 3);

  return {
    a: za,
    b: zb,
    ageA: a.age,
    ageB: b.age,
    overall,
    verdict: verdictOf(overall),
    couple: relation('couple', couple),
    spouse: relation('spouse', spouse),
    friend: relation('friend', friend)
  };
}

export const elementLabel = (z: Zodiac): string => EL_NAME[z.element];
