import type { Gender } from './zodiac';

export interface SignFact {
  name: string;
  en: string;
  element: string;
  mode: string;
  polarity: string;
  key: string;
}

export const SIGNS: SignFact[] = [
  { name: '白羊座', en: 'Aries', element: '火象', mode: '基本宫', polarity: '阳', key: '直接、冲动、先做后想，讨厌拖泥带水' },
  { name: '金牛座', en: 'Taurus', element: '土象', mode: '固定宫', polarity: '阴', key: '稳定、务实、慢热且固执，重视确定感' },
  { name: '双子座', en: 'Gemini', element: '风象', mode: '变动宫', polarity: '阳', key: '好奇、健谈、注意力跳跃，需要新鲜感' },
  { name: '巨蟹座', en: 'Cancer', element: '水象', mode: '基本宫', polarity: '阴', key: '敏感、护短、情绪先行，把安全感看得很重' },
  { name: '狮子座', en: 'Leo', element: '火象', mode: '固定宫', polarity: '阳', key: '自信、大方、需要被认可，有主角意识' },
  { name: '处女座', en: 'Virgo', element: '土象', mode: '变动宫', polarity: '阴', key: '细致、挑剔、用做事表达关心，怕失控' },
  { name: '天秤座', en: 'Libra', element: '风象', mode: '基本宫', polarity: '阳', key: '讲和、审美好、回避冲突，难以下定决心' },
  { name: '天蝎座', en: 'Scorpio', element: '水象', mode: '固定宫', polarity: '阴', key: '专注、深刻、掌控欲强，信任门槛高' },
  { name: '射手座', en: 'Sagittarius', element: '火象', mode: '变动宫', polarity: '阳', key: '自由、直率、乐观，最怕被安排' },
  { name: '摩羯座', en: 'Capricorn', element: '土象', mode: '基本宫', polarity: '阴', key: '克制、目标导向、责任感重，表达偏内敛' },
  { name: '水瓶座', en: 'Aquarius', element: '风象', mode: '固定宫', polarity: '阳', key: '独立、抽离、想法超前，重视精神空间' },
  { name: '双鱼座', en: 'Pisces', element: '水象', mode: '变动宫', polarity: '阴', key: '共情、浪漫、边界感模糊，容易心软' }
];

const ELEMENT_RELATION: Record<string, string> = {
  '火象|火象': '同元素，节奏一致但容易一起上头',
  '土象|土象': '同元素，稳上加稳，也容易一起僵住',
  '风象|风象': '同元素，聊得来，但都可能回避落地',
  '水象|水象': '同元素，共情极强，也容易一起沉溺',
  '火象|风象': '互补元素，火借风势、风助火燃，互动有劲',
  '土象|水象': '互补元素，土给水形状、水给土温度，适合长期',
  '火象|土象': '节奏不同，一个要快一个要稳，需要磨合',
  '火象|水象': '表达方式相反，一个直给一个内收，容易互相误读',
  '土象|风象': '一个要落地一个要抽离，容易在各说各话',
  '风象|水象': '理性与情绪错位，讲道理和讲感受容易对不上'
};

export function elementPairText(e1: string, e2: string): string {
  const order = ['火象', '土象', '风象', '水象'];
  const k = [e1, e2].sort((x, y) => order.indexOf(x) - order.indexOf(y)).join('|');
  return ELEMENT_RELATION[k] || '元素组合较为中性';
}

export const SYSTEM_PROMPT = `你是「星座速配」小程序里的资深星座内容作者，擅长用太阳星座写轻松、具体、有画面感的关系解读。读者是普通年轻人，正在好奇自己和某个人到底合不合。你要写得像一个很懂星座、又不装神弄鬼的朋友在跟他聊天。

# 你只能使用这些信息
太阳星座（含元素、模式、极性）、年龄、性别的可选信息、以及系统给出的算法基准分。
不要编造上升星座、月亮星座、宫位、行星相位、星盘、血型、星座运势日期等任何不存在的信息。也不要引用「某星座今日运势」这类内容。

# 写作要求
1. 具体优于形容。每个判断都要落到可观察的行为：怎么吵架、怎么表达喜欢、周末怎么过、钱怎么花、冷战多久会先低头。不要通篇堆「温柔」「有魅力」这种空词。
2. 允许有锋芒。可以指出真实的摩擦点，但落点必须是可操作的相处建议，或可以被接受的差异。不做绝对化断言：不写「一定会分手」「注定不幸」「绝对不合适」。
3. 用「TA」指代 A，用「你」指代 B。正文里**不要出现字母 A、B**（不要写「白羊座A」「B会…」），需要点名时直接说星座名。可以提到性别与年龄，但不得据此做优劣判断，不得使用「男人就该…」「女人总是…」这类表述，不物化任何一方。
4. 娱乐向。不宣称科学，不给医疗、法律、投资建议，不评价谁配不上谁。
5. 用简体中文口语写作。输出纯文本：不要 Markdown（不用 #、##、**、-、>），不要 emoji，不要「首先 / 其次 / 综上」这类作文腔，不要加任何开场白或结束语。

# 打分规则
1. 恋人、夫妻、朋友各给一个 0–100 的整数。
2. 系统会给出一组算法基准分。你的分数应当在基准分 ±12 以内；只有你有明确理由时才可突破，但最多 ±18。
3. 三个分数不能全部相同，必须有区分度，而且谁高谁低必须和后面的分析文字一致。
4. 65–85 是常态区间，不要给所有组合都打高分，也不要为了戏剧性刻意打低分。
5. 三个维度的判断标准不同：
   - 恋人：看吸引力、张力、心动感，差异有时反而是火花；
   - 夫妻：看长期共处的稳定性、生活节奏、冲突修复能力，激情不是主要因素；
   - 朋友：最宽容，看相处是否轻松、有没有共同语言。

# 输出格式（必须严格遵守）
按下面 6 个分段顺序输出。每个标记必须独占一行，内容紧跟在标记的下一行。
关系分段的第一行只写一个数字（分数），第二行起才是分析文字。

<<<A>>>
（A 的性格，2–3 句，60–110 字）
<<<B>>>
（B 的性格，2–3 句，60–110 字）
<<<COUPLE>>>
（只写分数，纯数字）
（恋人维度分析，2–3 句，60–110 字）
<<<SPOUSE>>>
（只写分数，纯数字）
（夫妻维度分析，2–3 句，60–110 字）
<<<FRIEND>>>
（只写分数，纯数字）
（朋友维度分析，2–3 句，60–110 字）
<<<SUMMARY>>>
（一句话总结，40 字以内，要有记忆点，适合被截图转发）

除这 6 个标记外，不要输出任何其他标题、编号或说明。全文控制在 600 字以内。`;

const GENDER_TEXT: Record<string, string> = { male: '男', female: '女' };

export interface AnalyzeInput {
  a: { sign: number; age: number | null; gender: Gender | null };
  b: { sign: number; age: number | null; gender: Gender | null };
  base: { couple: number; spouse: number; friend: number; overall: number };
}

function profileLine(label: string, p: AnalyzeInput['a'], sign: SignFact): string {
  const parts = [
    sign.name,
    sign.element,
    sign.mode,
    p.age ? `${p.age} 岁` : '年龄未提供',
    p.gender ? GENDER_TEXT[p.gender] : '性别未提供'
  ];
  return `【${label}】${parts.join(' · ')}\n核心特质：${sign.key}`;
}

export function buildUserPrompt(input: AnalyzeInput): string {
  const { a, b, base } = input;
  const sa = SIGNS[a.sign];
  const sb = SIGNS[b.sign];

  const ageGap = a.age && b.age ? Math.abs(a.age - b.age) : null;
  const gapText = ageGap === null
    ? '年龄信息不完整，不做年龄差判断'
    : ageGap === 0 ? '同龄' : `相差 ${ageGap} 岁`;

  return [
    '请为下面两个人写一份星座配对解读。',
    '',
    profileLine('A', a, sa),
    profileLine('B', b, sb),
    '',
    `【元素关系】${elementPairText(sa.element, sb.element)}`,
    `【年龄差】${gapText}`,
    '【用户关注的关系】未指定，三个维度都需要完整评价',
    `【算法基准分】恋人 ${base.couple} · 夫妻 ${base.spouse} · 朋友 ${base.friend} · 综合 ${base.overall}`,
    '（基准分只用于锚定，你需要在此基础上给出自己的判断，并说明理由）',
    '',
    '请严格按约定的 6 个分段格式输出。'
  ].join('\n');
}

export function buildMessages(input: AnalyzeInput) {
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: buildUserPrompt(input) }
  ];
}

export const GEN_PARAMS = {
  temperature: 0.85,
  top_p: 0.9,
  // 推理模型（glm-5.3 等）的思考 token 也计入 max_tokens，
  // 1200 会被思考过程吃光导致正文只剩几个字，这里留足预算。
  max_tokens: 4096
};
