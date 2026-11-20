export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Gender = 'male' | 'female';

export interface Zodiac {
  name: string;
  symbol: string;
  element: Element;
  traits: [string, string, string];
  desc: string;
}

export const ZODIACS: Zodiac[] = [
  { name: '白羊座', symbol: '♈', element: 'fire', traits: ['热情', '直率', '勇敢'], desc: '行动力满格，想到就去做，爱恨都很直接。' },
  { name: '金牛座', symbol: '♉', element: 'earth', traits: ['稳重', '务实', '享受'], desc: '踏实可靠，懂得生活，认定的事很难改变。' },
  { name: '双子座', symbol: '♊', element: 'air', traits: ['机智', '好奇', '善聊'], desc: '脑子转得快，永远有新鲜话题，双重性格。' },
  { name: '巨蟹座', symbol: '♋', element: 'water', traits: ['温柔', '顾家', '敏感'], desc: '细腻体贴，重感情，天生会照顾身边的人。' },
  { name: '狮子座', symbol: '♌', element: 'fire', traits: ['自信', '慷慨', '耀眼'], desc: '自带光环，大方霸气，需要被欣赏和关注。' },
  { name: '处女座', symbol: '♍', element: 'earth', traits: ['细致', '理性', '完美'], desc: '追求细节，逻辑清晰，默默把事情做到最好。' },
  { name: '天秤座', symbol: '♎', element: 'air', traits: ['优雅', '公平', '社交'], desc: '审美在线，擅长协调，难得拿定主意。' },
  { name: '天蝎座', symbol: '♏', element: 'water', traits: ['神秘', '深刻', '占有'], desc: '洞察力强，爱得深沉，感情里浓度很高。' },
  { name: '射手座', symbol: '♐', element: 'fire', traits: ['自由', '乐观', '坦率'], desc: '热爱远方，心直口快，讨厌被束缚。' },
  { name: '摩羯座', symbol: '♑', element: 'earth', traits: ['自律', '目标', '责任'], desc: '成熟稳重，目标感强，靠努力一步步向上。' },
  { name: '水瓶座', symbol: '♒', element: 'air', traits: ['独立', '创新', '博爱'], desc: '特立独行，脑洞清奇，重视精神自由。' },
  { name: '双鱼座', symbol: '♓', element: 'water', traits: ['浪漫', '善良', '多情'], desc: '共情力满分，爱幻想，心里住着一片海。' }
];

export const EL_NAME: Record<Element, string> = {
  fire: '火象',
  earth: '土象',
  air: '风象',
  water: '水象'
};

const ORDER: Element[] = ['fire', 'earth', 'air', 'water'];

export const elementKey = (a: Element, b: Element): string =>
  [a, b].sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).join('|');

export const COUPLE_BASE: Record<string, number> = {
  'fire|fire': 72, 'earth|fire': 52, 'fire|air': 86, 'fire|water': 48,
  'earth|earth': 68, 'earth|air': 58, 'earth|water': 78,
  'air|air': 74, 'air|water': 60, 'water|water': 80
};

export const FRIEND_BASE: Record<string, number> = {
  'fire|fire': 80, 'earth|fire': 66, 'fire|air': 84, 'fire|water': 62,
  'earth|earth': 76, 'earth|air': 68, 'earth|water': 84,
  'air|air': 78, 'air|water': 70, 'water|water': 82
};

const TRINES: [string, string][] = [
  ['白羊座', '狮子座'], ['狮子座', '射手座'], ['白羊座', '射手座'],
  ['金牛座', '处女座'], ['处女座', '摩羯座'], ['金牛座', '摩羯座'],
  ['双子座', '天秤座'], ['天秤座', '水瓶座'], ['双子座', '水瓶座'],
  ['巨蟹座', '天蝎座'], ['天蝎座', '双鱼座'], ['巨蟹座', '双鱼座']
];

const OPPOSITES: [string, string][] = [
  ['白羊座', '天秤座'], ['金牛座', '天蝎座'], ['双子座', '射手座'],
  ['巨蟹座', '摩羯座'], ['狮子座', '水瓶座'], ['处女座', '双鱼座']
];

const SQUARES: [string, string][] = [
  ['白羊座', '摩羯座'], ['金牛座', '水瓶座'], ['双子座', '处女座'],
  ['巨蟹座', '天秤座'], ['狮子座', '天蝎座'], ['处女座', '射手座'],
  ['天秤座', '摩羯座'], ['天蝎座', '水瓶座'], ['射手座', '双鱼座']
];

export const ASPECTS = { TRINES, OPPOSITES, SQUARES };

export const hasAspect = (list: [string, string][], a: string, b: string): boolean =>
  list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

export const LEVELS: [number, string][] = [
  [88, '天作之合'],
  [75, '高度契合'],
  [60, '相当不错'],
  [45, '需要磨合'],
  [0, '挑战不小']
];

export const levelOf = (score: number): string =>
  LEVELS.find(([min]) => score >= min)![1];

export const TEXTS: Record<'couple' | 'spouse' | 'friend', string[]> = {
  couple: [
    '你们之间的吸引力几乎写在星盘里，越靠近越上头。',
    '节奏合拍，用心经营就是让人羡慕的一对。',
    '有差异也有火花，多一点耐心就会很甜。',
    '性格碰撞明显，但真诚能化解大部分难题。',
    '挑战不小，充足的沟通是这段关系的必修课。'
  ],
  spouse: [
    '生活节奏高度互补，适合一起把日子过成诗。',
    '价值观相近，是能一起扛事、一起享受的人。',
    '婚后需要磨合，但底座稳固，值得慢慢经营。',
    '差异需要被看见，分工与包容是关键。',
    '长期相处压力偏大，建议先做朋友再谈未来。'
  ],
  friend: [
    '聊得来又玩得开，是能一起疯也能一起静的挚友。',
    '兴趣相投，相处轻松，友谊的小船很稳。',
    '总体合拍，偶尔的小摩擦无伤大雅。',
    '需要找到共同话题，熟悉之后会越来越顺。',
    '相处需要更多主动，惊喜往往藏在细节里。'
  ]
};

export const textOf = (cat: 'couple' | 'spouse' | 'friend', score: number): string => {
  const idx = LEVELS.findIndex(([min]) => score >= min);
  return TEXTS[cat][idx];
};

export const verdictOf = (score: number): string =>
  score >= 88 ? '天作之合，缘分不浅'
    : score >= 75 ? '高度契合，越处越甜'
    : score >= 60 ? '挺合拍，慢慢磨合'
    : score >= 45 ? '有差异，也有火花'
    : '挑战不小，且行且珍惜';
