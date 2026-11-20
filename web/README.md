# 星座速配 · Web 版

Next.js 16（App Router）+ TypeScript 实现的星座配对应用。算法算分在前端即时完成，AI 深度解读由服务端代理大模型并以 SSE 流式返回。当前默认接的是阿里云百炼的 `glm-5.3`，任何 OpenAI 兼容服务都能替换。

> 技术栈选择理由：Vercel 原生支持、前后端同仓库一次部署、API Route 能安全持有 Key（`AI_API_KEY` 不会进入浏览器）。

## 本地运行

```bash
cd web
npm install
cp .env.example .env.local   # 填入真实 Key
npm run dev                  # http://localhost:3000
```

生产模式：

```bash
npm run build && npm start
```

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `AI_API_KEY` | 是 | — | 大模型 API Key。**未配置时 AI 按钮返回 503**，算法与结果页不受影响 |
| `AI_BASE_URL` | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI 兼容接入点（阿里云百炼） |
| `AI_MODEL` | 否 | `glm-5.3` | 模型 ID |

本地开发写入 `.env.local`（已在 `.gitignore` 中，不会入库）。

**换供应商**只改这三行，代码不用动。同为 OpenAI 兼容协议的有：

```ini
# 七牛云
AI_BASE_URL=https://api.qnaigc.com/v1
AI_MODEL=deepseek/deepseek-v4.1-flash-1017

# DeepSeek 官方
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

# 硅基流动
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=deepseek-ai/DeepSeek-V3
```

### 关于推理模型

`glm-5.3` 这类推理模型会先输出 `reasoning_content`（思考过程），再输出正文，且**思考 token 也计入 `max_tokens`**。所以：

- `lib/prompt.ts` 里 `max_tokens` 设为 4096（原来 1200 会被思考吃光，正文只剩几个字）；
- 服务端把思考过程单独计数，通过 `thinking` 事件节流上报，前端显示「AI 正在思考…（已推理 N 字）」，避免对着空白面板干等；
- 实测一次完整分析约 20–28 秒，其中思考占 15–20 秒。想更快就换非推理模型（如 `deepseek-chat`、`qwen-plus`）。

## 部署到 Vercel

1. 把 `web/` 目录推到 GitHub（注意：项目根目录若包含 `高保真原型/`、`server/`、`web/` 等，需在 Vercel 里把 **Root Directory 设为 `web`**）。
2. Vercel → New Project → 导入仓库 → Root Directory 选 `web`，框架自动识别 Next.js。
3. Settings → Environment Variables 添加 `AI_API_KEY`（Production / Preview / Development 都勾上），可选加 `AI_BASE_URL`、`AI_MODEL`。
4. Deploy。部署完成后 `https://<域名>/api/analyze` 返回 `{"ok":true,"configured":true,...}` 即表示 Key 已生效。

推到 GitHub 前确认 `.env.local` 未被提交：

```bash
git status --ignored | grep env   # .env.local 应出现在 ignored 里
```

## 目录结构

```
web/
├── app/
│   ├── api/analyze/route.ts   SSE 流式代理（校验入参 → 调上游 → 转 SSE）
│   ├── layout.tsx             全局布局与字体
│   ├── page.tsx               输入页 + 结果页切换
│   └── globals.css            主题与全部样式
├── components/
│   ├── PersonCard.tsx         单人卡片：星座格 / 性别 / 年龄滚轮
│   ├── WheelPicker.tsx        滚动选择器（滚动吸附）
│   ├── ResultView.tsx         结果页：综合环 + 三卡 + 性格速览
│   ├── AIPanel.tsx            AI 面板：流式渲染 + 分数对比
│   └── Stars.tsx              星空背景
└── lib/
    ├── zodiac.ts              12 星座数据、元素关系、相位表
    ├── score.ts               匹配算法（恋人/夫妻/朋友 + 综合）
    ├── prompt.ts              提示词模板与消息构造
    ├── parse.ts               把流式文本按 <<<MARK>>> 切成 6 段
    └── poster.ts              Canvas 生成分享海报
```

## 接口

`GET /api/analyze` — 健康检查

```json
{ "ok": true, "configured": true, "model": "deepseek/...", "baseUrl": "https://api.qnaigc.com/v1" }
```

`POST /api/analyze` — 流式分析

```json
{
  "a": { "sign": 0, "age": 26 },
  "b": { "sign": 4, "age": 24 },
  "base": { "couple": 88, "spouse": 85, "friend": 86, "overall": 79 }
}
```

返回 `text/event-stream`，事件类型：

- `meta` — `{ model, ts }`
- `thinking` — `{ chars }`，推理模型的思考进度（节流上报，正文开始后不再发送）
- `delta` — `{ t: "文本片段" }`，逐字拼接
- `done` — `{ chars, thinkChars, truncated, ms }`
- `error` — `{ message }`

前端按 `<<<A>>>` `<<<B>>>` `<<<COUPLE>>>` `<<<SPOUSE>>>` `<<<FRIEND>>>` `<<<SUMMARY>>>` 六个标记切分渲染，关系段第一行是 AI 给出的分数。

## 报错对照

| HTTP | 含义 | 处理 |
|---|---|---|
| 400 | 入参非法（`sign` 不在 0–11 等） | 前端提示并中止 |
| 502 | 上游非 2xx | 透传上游 `error.message` 与 `code` |
| 503 | 服务端未配 `AI_API_KEY` | 检查环境变量 |
| 504 | 上游超时（60s） | 重试 |

常见的上游 403 `account_chat_banned` 表示 Key 所属账号无对话权限，需在服务商侧开通，不是代码问题。

## 与原型的关系

`../高保真原型/index.html` 是可双击打开的单文件原型（技术验证用）。`web/` 是可在 Vercel 部署的正式实现，视觉与算法保持一致。
