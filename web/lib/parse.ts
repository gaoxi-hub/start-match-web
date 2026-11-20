export type SectionKey = 'A' | 'B' | 'COUPLE' | 'SPOUSE' | 'FRIEND' | 'SUMMARY';

export const RELATION_KEYS = ['COUPLE', 'SPOUSE', 'FRIEND'] as const;
export type RelationKey = (typeof RELATION_KEYS)[number];

export interface Section {
  text: string;
  score?: number;
}

export interface ParsedStream {
  sections: Partial<Record<SectionKey, Section>>;
  /** 正在输出的分段，用于显示光标 */
  active: SectionKey | null;
  /** 已出现的分段顺序 */
  order: SectionKey[];
}

const MARK_RE = /<<<\s*(A|B|COUPLE|SPOUSE|FRIEND|SUMMARY)\s*>>>/g;

const isRelation = (k: SectionKey): k is RelationKey =>
  k === 'COUPLE' || k === 'SPOUSE' || k === 'FRIEND';

/**
 * 把流式累计的全文切成 6 个分段。
 * 每次收到增量都重算一遍，天然得到逐字渲染效果。
 */
export function parseStream(full: string): ParsedStream {
  const marks: { key: SectionKey; start: number; end: number }[] = [];
  MARK_RE.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = MARK_RE.exec(full)) !== null) {
    marks.push({ key: m[1] as SectionKey, start: m.index, end: m.index + m[0].length });
  }

  const sections: Partial<Record<SectionKey, Section>> = {};
  const order: SectionKey[] = [];

  marks.forEach((mark, i) => {
    if (sections[mark.key]) return;

    const isLast = i === marks.length - 1;
    let body = full.slice(mark.end, i + 1 < marks.length ? marks[i + 1].start : full.length);

    // 末段可能停在半个标记上，先剥掉，等下一批数据
    if (isLast) body = body.replace(/<{1,3}[A-Za-z]{0,12}\s*$/, '');

    body = body.replace(/^[ \t]*\r?\n+/, '');

    const section: Section = { text: body };

    if (isRelation(mark.key)) {
      const nl = body.indexOf('\n');
      const firstLine = (nl === -1 ? body : body.slice(0, nl)).trim();
      const scoreMatch = firstLine.match(/^[^\d]{0,4}(\d{1,3})[^\d]{0,4}$/);
      if (scoreMatch) {
        section.score = Math.max(0, Math.min(100, Number(scoreMatch[1])));
        section.text = nl === -1 ? '' : body.slice(nl + 1).replace(/^[ \t]*\n+/, '');
      }
    }

    sections[mark.key] = section;
    order.push(mark.key);
  });

  const active = marks.length ? marks[marks.length - 1].key : null;

  return { sections, active, order };
}
