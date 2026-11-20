import { EL_NAME } from './zodiac';
import type { MatchResult } from './score';

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** 生成 750×1150 的竖版分享海报 */
export function drawPoster(r: MatchResult): HTMLCanvasElement {
  const W = 750;
  const H = 1150;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d')!;
  const F = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0818');
  bg.addColorStop(0.5, '#1a1033');
  bg.addColorStop(1, '#2a1746');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(375, 330, 20, 375, 330, 420);
  glow.addColorStop(0, 'rgba(167,139,250,.24)');
  glow.addColorStop(1, 'rgba(167,139,250,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 130; i++) {
    ctx.globalAlpha = Math.random() * 0.65 + 0.08;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.7 + 0.4, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';

  ctx.fillStyle = '#FFD36E';
  ctx.font = '600 22px ' + F;
  ctx.fillText('✦ SIGN MATCH · 星座速配', W / 2, 68);

  ctx.fillStyle = '#fff';
  ctx.font = '800 44px ' + F;
  ctx.fillText('星座速配报告', W / 2, 126);

  ctx.fillStyle = '#9E95C0';
  ctx.font = '20px ' + F;
  ctx.fillText('恋人 · 夫妻 · 朋友 三维契合度', W / 2, 164);

  ctx.font = '700 46px ' + F;
  ctx.fillStyle = '#fff';
  ctx.fillText(r.a.symbol, 210, 258);
  ctx.fillText(r.b.symbol, 540, 258);

  ctx.font = '700 24px ' + F;
  ctx.fillText(r.a.name, 210, 302);
  ctx.fillText(r.b.name, 540, 302);

  ctx.fillStyle = '#9E95C0';
  ctx.font = '18px ' + F;
  ctx.fillText(EL_NAME[r.a.element] + ' · ' + r.ageA + '岁', 210, 332);
  ctx.fillText(EL_NAME[r.b.element] + ' · ' + r.ageB + '岁', 540, 332);

  ctx.fillStyle = '#FF7EB6';
  ctx.font = '800 28px ' + F;
  ctx.fillText('×', 375, 270);

  const cx = 375;
  const cy = 428;
  const rad = 62;

  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = 14;
  ctx.stroke();

  const arcG = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad);
  arcG.addColorStop(0, '#FFD36E');
  arcG.addColorStop(1, '#FF7EB6');
  ctx.beginPath();
  ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (r.overall / 100));
  ctx.strokeStyle = arcG;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '900 44px ' + F;
  ctx.fillText(String(r.overall), cx, cy + 8);

  ctx.fillStyle = '#9E95C0';
  ctx.font = '13px ' + F;
  ctx.fillText('综合契合指数', cx, cy + 34);

  const rows: Array<['couple' | 'spouse' | 'friend', string, string, string]> = [
    ['couple', '💞 恋人', '#FFD36E', '#FF7EB6'],
    ['spouse', '💍 夫妻', '#A78BFA', '#7DD3FC'],
    ['friend', '🤝 朋友', '#7DD3FC', '#A7F3D0']
  ];

  rows.forEach(([key, label, c1, c2], i) => {
    const y = 520 + i * 148;
    const item = r[key];

    roundRect(ctx, 50, y, 650, 128, 26);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '700 25px ' + F;
    ctx.fillText(label, 88, y + 44);

    ctx.fillStyle = c1;
    ctx.font = '700 19px ' + F;
    ctx.fillText(item.level, 88, y + 76);

    ctx.textAlign = 'right';
    ctx.fillStyle = c1;
    ctx.font = '900 44px ' + F;
    ctx.fillText(String(item.score), 660, y + 52);

    ctx.fillStyle = '#9E95C0';
    ctx.font = '16px ' + F;
    ctx.fillText('分', 660, y + 76);

    const bw = 572;
    const bx = 88;
    const by = y + 96;

    roundRect(ctx, bx, by, bw, 10, 5);
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    ctx.fill();

    const fg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    fg.addColorStop(0, c1);
    fg.addColorStop(1, c2);
    roundRect(ctx, bx, by, Math.max(10, (bw * item.score) / 100), 10, 5);
    ctx.fillStyle = fg;
    ctx.fill();

    ctx.textAlign = 'center';
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD36E';
  ctx.font = '700 22px ' + F;
  ctx.fillText(r.verdict, W / 2, 1012);

  ctx.fillStyle = 'rgba(255,255,255,.38)';
  ctx.font = '16px ' + F;
  ctx.fillText('本结果仅供娱乐 · 基于太阳星座的趣味规则引擎', W / 2, H - 44);

  return canvas;
}

export function posterFileName(r: MatchResult): string {
  return `星座速配_${r.a.name}_${r.b.name}.png`;
}
