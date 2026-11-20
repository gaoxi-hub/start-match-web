import { buildMessages, GEN_PARAMS, type AnalyzeInput } from '@/lib/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// 推理模型（如 glm-5.3）先思考再作答，Vercel 上需要显式放宽函数时长
export const maxDuration = 60;

const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/+$/, '');
const AI_MODEL = process.env.AI_MODEL || 'deepseek/deepseek-v4.1-flash-1017';
const AI_API_KEY = process.env.AI_API_KEY || '';

const UPSTREAM_TIMEOUT = 60_000;

const clampScore = (n: unknown): number => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
};

function parsePerson(raw: unknown, label: string): { value: AnalyzeInput['a'] } | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: `${label} 缺失` };
  const p = raw as Record<string, unknown>;

  const sign = Number(p.sign);
  if (!Number.isInteger(sign) || sign < 0 || sign > 11) {
    return { error: `${label}.sign 必须是 0-11 的整数` };
  }

  let age: number | null = p.age === null || p.age === undefined || p.age === '' ? null : Number(p.age);
  if (age !== null && (!Number.isFinite(age) || age < 18 || age > 100)) age = null;

  const gender = p.gender === 'male' || p.gender === 'female' ? p.gender : null;

  return { value: { sign, age: age === null ? null : Math.round(age), gender } };
}

export async function POST(req: Request) {
  if (!AI_API_KEY) {
    return Response.json(
      { error: '服务端未配置 AI_API_KEY，请在环境变量中设置' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const a = parsePerson(raw.a, 'a');
  const b = parsePerson(raw.b, 'b');
  if ('error' in a) return Response.json({ error: a.error }, { status: 400 });
  if ('error' in b) return Response.json({ error: b.error }, { status: 400 });

  const base = (raw.base || {}) as Record<string, unknown>;
  const input: AnalyzeInput = {
    a: a.value,
    b: b.value,
    base: {
      couple: clampScore(base.couple),
      spouse: clampScore(base.spouse),
      friend: clampScore(base.friend),
      overall: clampScore(base.overall)
    }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: buildMessages(input),
        stream: true,
        ...GEN_PARAMS
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return Response.json(
      { error: aborted ? 'AI 响应超时，请稍后重试' : 'AI 服务暂时不可用' },
      { status: 504 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timer);
    const detail = await upstream.text().catch(() => '');

    let upstreamMsg = '';
    try {
      const j = JSON.parse(detail);
      upstreamMsg = j.error?.message || j.message || '';
      if (j.error?.code) upstreamMsg += `（${j.error.code}）`;
    } catch {
      upstreamMsg = detail.slice(0, 160);
    }

    const hint = upstream.status === 401 ? 'API Key 无效或已过期'
      : upstream.status === 402 ? '账户余额不足'
      : upstream.status === 403 ? '该 API Key 所属账号无对话权限'
      : upstream.status === 429 ? '上游限流，请稍后重试'
      : upstream.status === 404 ? '接口地址或模型 ID 不存在'
      : '上游服务返回异常';

    return Response.json(
      { error: upstreamMsg ? `${hint}：${upstreamMsg}` : `${hint}（HTTP ${upstream.status}）` },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    // 注意：start 必须同步返回，长循环放到内部异步任务里，
    // 否则响应会一直挂起、客户端拿不到任何字节。
    start(ctrl) {
      const send = (event: string, data: unknown) => {
        try {
          ctrl.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* 客户端已断开 */
        }
      };

      (async () => {
        send('meta', { model: AI_MODEL, ts: Date.now() });

        const decoder = new TextDecoder();
        let buffer = '';
        let chars = 0;
        let thinkChars = 0;
        let lastThink = 0;
        let finishReason = '';
        const started = Date.now();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';

            for (const block of blocks) {
              for (const line of block.split('\n')) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === '[DONE]') continue;

                let json: unknown;
                try {
                  json = JSON.parse(payload);
                } catch {
                  continue;
                }

                const delta = (json as any)?.choices?.[0]?.delta;
                const fr = (json as any)?.choices?.[0]?.finish_reason;
                if (fr) finishReason = String(fr);
                if (!delta) continue;

                // 推理模型会先把思考过程放在 reasoning_content，正文可能十几秒后才开始。
                // 这里单独计数并节流上报，避免前端对着空白面板干等。
                const reasoning = typeof delta.reasoning_content === 'string' ? delta.reasoning_content : '';
                if (reasoning) {
                  thinkChars += reasoning.length;
                  const now = Date.now();
                  if (!chars && now - lastThink > 600) {
                    lastThink = now;
                    send('thinking', { chars: thinkChars });
                  }
                }

                const content = typeof delta.content === 'string' ? delta.content : '';
                if (content) {
                  chars += content.length;
                  send('delta', { t: content });
                }
              }
            }
          }

          // 被 max_tokens 截断：正文几乎没出来时直接报错，避免前端拿到半截标记渲染成空白
          if (finishReason === 'length' && chars < 200) {
            send('error', {
              message: 'AI 思考占满了输出长度，正文没有生成，请重试'
            });
            return;
          }

          send('done', {
            chars,
            thinkChars,
            truncated: finishReason === 'length',
            ms: Date.now() - started
          });
        } catch {
          send('error', { message: 'AI 输出中断，请重试' });
        } finally {
          clearTimeout(timer);
          try {
            ctrl.close();
          } catch {
            /* 已关闭 */
          }
        }
      })();
    },
    cancel() {
      clearTimeout(timer);
      controller.abort();
      reader.cancel().catch(() => {});
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no'
    }
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    configured: Boolean(AI_API_KEY),
    model: AI_MODEL,
    baseUrl: AI_BASE_URL
  });
}
