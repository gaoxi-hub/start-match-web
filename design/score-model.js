/**
 * 星座速配 · 匹配程度算法 v0.1
 * 纯函数、无依赖，可直接在浏览器或 Node 中运行。
 *
 * 用法：
 *   const r = SignMatchScore.scorePair({sign:0,age:26},{sign:4,age:24});
 *   // { couple, spouse, friend, overall, level, aspect, elementMod, ageMod, best, worst }
 *
 * 设计说明见 design/匹配算法设计.md
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.SignMatchScore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---------- 12 星座（黄道顺序，index 即宫位） ---------- */
  const SIGNS = [
    { i: 0,  name: '白羊座', symbol: '♈', element: 'fire'  },
    { i: 1,  name: '金牛座', symbol: '♉', element: 'earth' },
    { i: 2,  name: '双子座', symbol: '♊', element: 'air'   },
    { i: 3,  name: '巨蟹座', symbol: '♋', element: 'water' },
    { i: 4,  name: '狮子座', symbol: '♌', element: 'fire'  },
    { i: 5,  name: '处女座', symbol: '♍', element: 'earth' },
    { i: 6,  name: '天秤座', symbol: '♎', element: 'air'   },
    { i: 7,  name: '天蝎座', symbol: '♏', element: 'water' },
    { i: 8,  name: '射手座', symbol: '♐', element: 'fire'  },
    { i: 9,  name: '摩羯座', symbol: '♑', element: 'earth' },
    { i: 10, name: '水瓶座', symbol: '♒', element: 'air'   },
    { i: 11, name: '双鱼座', symbol: '♓', element: 'water' }
  ];

  const ELEMENT_CN = { fire: '火象', earth: '土象', air: '风象', water: '水象' };

  /* ---------- 相位基础分：key = d = min(|i-j|, 12-|i-j|) ---------- */
  const ASPECTS = {
    0: { angle: 0,   name: '合相',       couple: 72, spouse: 70, friend: 76 },
    1: { angle: 30,  name: '半六分',     couple: 52, spouse: 55, friend: 60 },
    2: { angle: 60,  name: '六分',       couple: 82, spouse: 78, friend: 86 },
    3: { angle: 90,  name: '刑相',       couple: 45, spouse: 48, friend: 54 },
    4: { angle: 120, name: '三分',       couple: 85, spouse: 82, friend: 88 },
    5: { angle: 150, name: '十二分之五', couple: 54, spouse: 50, friend: 58 },
    6: { angle: 180, name: '对分',       couple: 76, spouse: 58, friend: 64 }
  };

  /* ---------- 元素修正 ---------- */
  const ORDER = ['fire', 'earth', 'air', 'water'];
  const ELEMENT_MOD = {
    'fire|fire': 3, 'earth|earth': 3, 'air|air': 2, 'water|water': 2,
    'fire|air': 4, 'earth|water': 4,
    'fire|earth': -2, 'fire|water': -5, 'earth|air': -3, 'air|water': -2
  };
  const elemKey = (a, b) =>
    [a, b].sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).join('|');

  /* ---------- 年龄差修正（夫妻最敏感、朋友最宽容） ---------- */
  const AGE_MOD = [
    { max: 3,        couple: 0,   spouse: 0,   friend: 0  },
    { max: 6,        couple: -3,  spouse: -2,  friend: -1 },
    { max: 10,       couple: -6,  spouse: -5,  friend: -2 },
    { max: 15,       couple: -10, spouse: -8,  friend: -3 },
    { max: Infinity, couple: -14, spouse: -12, friend: -4 }
  ];

  /* ---------- 综合权重（方案 A：固定权重） ---------- */
  const DEFAULT_WEIGHTS = { couple: 0.4, spouse: 0.3, friend: 0.3 };

  /* 判定「最适合关系」用的相对偏移：三类基准分不同（朋友整体比夫妻高约 6 分） */
  const REL_OFFSET = { couple: 0, spouse: 3, friend: -4 };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function aspectOf(i, j) {
    const raw = Math.abs(i - j);
    const d = Math.min(raw, 12 - raw);
    return Object.assign({ d }, ASPECTS[d]);
  }

  function ageModOf(gap) {
    if (gap === null || gap === undefined || isNaN(gap) || gap < 0) {
      return { couple: 0, spouse: 0, friend: 0, gap: null };
    }
    const row = AGE_MOD.find(r => gap <= r.max);
    return { couple: row.couple, spouse: row.spouse, friend: row.friend, gap };
  }

  function levelOf(score) {
    if (score >= 90) return '天作之合';
    if (score >= 80) return '高度契合';
    if (score >= 65) return '相当合拍';
    if (score >= 50) return '需要磨合';
    if (score >= 35) return '挑战不小';
    return '缘分较浅';
  }

  /**
   * 计算一对星座的三类契合度与综合分
   * @param {number|{sign:number,age?:number}} a
   * @param {number|{sign:number,age?:number}} b
   * @param {{weights?:{couple:number,spouse:number,friend:number}}} [opt]
   */
  function scorePair(a, b, opt) {
    const ia = typeof a === 'number' ? a : a.sign;
    const ib = typeof b === 'number' ? b : b.sign;
    const sa = SIGNS[ia];
    const sb = SIGNS[ib];
    if (!sa || !sb) throw new Error('无效的星座索引');

    const aspect = aspectOf(ia, ib);
    const elementMod = ELEMENT_MOD[elemKey(sa.element, sb.element)] || 0;

    const ageA = typeof a === 'object' ? a.age : null;
    const ageB = typeof b === 'object' ? b.age : null;
    const gap = (ageA !== null && ageA !== undefined && ageB !== null && ageB !== undefined)
      ? Math.abs(ageA - ageB) : null;
    const ageMod = ageModOf(gap);

    const couple = Math.round(clamp(aspect.couple + elementMod + ageMod.couple, 0, 100));
    const spouse = Math.round(clamp(aspect.spouse + elementMod + ageMod.spouse, 0, 100));
    const friend = Math.round(clamp(aspect.friend + elementMod + ageMod.friend, 0, 100));

    const weights = Object.assign({}, DEFAULT_WEIGHTS, opt && opt.weights);
    const overall = Math.round(couple * weights.couple + spouse * weights.spouse + friend * weights.friend);

    const list = [
      { key: 'couple', name: '恋人', score: couple },
      { key: 'spouse', name: '夫妻', score: spouse },
      { key: 'friend', name: '朋友', score: friend }
    ];
    // 「最适合」用相对适配度，抵消三类关系的基准差；并列时取原始分更高者
    const ranked = list.map(x => ({
      key: x.key, name: x.name, score: x.score,
      rel: x.score + REL_OFFSET[x.key]
    })).sort((x, y) => (y.rel - x.rel) || (y.score - x.score));
    const best = { key: ranked[0].key, name: ranked[0].name, score: ranked[0].score };

    const spread = Math.max(couple, spouse, friend) - Math.min(couple, spouse, friend);
    const balanced = spread < 8;                                   // 极差小于 8 视为三项均衡
    const lowest = list.slice().sort((x, y) => x.score - y.score)[0];
    const worst = balanced ? null : lowest;

    return {
      a: sa, b: sb,
      aspect, elementMod, ageGap: gap, ageMod,
      couple, spouse, friend, overall,
      level: levelOf(overall),
      best, worst, spread, balanced,
      weights
    };
  }

  /** 线性校准：把原始分布映射到目标均值/标准差 */
  function calibrate(score, mean, sd, targetMean, targetSd) {
    const tm = targetMean === undefined ? 70 : targetMean;
    const ts = targetSd === undefined ? 12 : targetSd;
    if (!sd) return Math.round(clamp(score, 30, 98));
    return Math.round(clamp(tm + (score - mean) * (ts / sd), 30, 98));
  }

  /** 全部 78 种组合（含同星座） */
  function allPairs() {
    const out = [];
    for (let i = 0; i < 12; i++) for (let j = i; j < 12; j++) out.push(scorePair(i, j));
    return out;
  }

  return {
    SIGNS, ELEMENT_CN, ASPECTS, ELEMENT_MOD, AGE_MOD, DEFAULT_WEIGHTS,
    aspectOf, ageModOf, levelOf, scorePair, calibrate, allPairs, clamp
  };
});

/* ---------- Node 下直接运行：node design/score-model.js ---------- */
if (typeof module !== 'undefined' && require.main === module) {
  const M = module.exports;
  const idx = name => M.SIGNS.findIndex(s => s.name === name);

  console.log('=== 示例 ===');
  [
    ['白羊座', '狮子座', 26, 24],
    ['白羊座', '摩羯座', 28, 23],
    ['金牛座', '天蝎座', 30, 22]
  ].forEach(([n1, n2, a1, a2]) => {
    const r = M.scorePair({ sign: idx(n1), age: a1 }, { sign: idx(n2), age: a2 });
    const hint = r.balanced ? '三项均衡' : `最适合：${r.best.name}（${r.best.score}）`;
    console.log(
      `${n1} × ${n2}  ${r.aspect.name}  ` +
      `恋人 ${r.couple} / 夫妻 ${r.spouse} / 朋友 ${r.friend}  ` +
      `综合 ${r.overall}（${r.level}）  ${hint}`
    );
  });

  const all = M.allPairs().map(r => r.overall);
  const mean = all.reduce((s, x) => s + x, 0) / all.length;
  const sd = Math.sqrt(all.reduce((s, x) => s + (x - mean) ** 2, 0) / all.length);
  const bucket = {};
  M.allPairs().forEach(r => { bucket[r.level] = (bucket[r.level] || 0) + 1; });

  console.log('\n=== 78 种组合分布（不含年龄差） ===');
  console.log(`均值 ${mean.toFixed(1)}  标准差 ${sd.toFixed(1)}  最低 ${Math.min(...all)}  最高 ${Math.max(...all)}`);
  console.log('等级分布：', bucket);
}
