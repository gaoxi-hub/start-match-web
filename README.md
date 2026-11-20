# 星座速配 · 高保真原型

输入两个人的星座 / 年龄 / 性别，给出恋人、夫妻、朋友三个维度的契合度，并可选调用大模型生成深度解读。

## 目录

```
sign-match-web/
├── 高保真原型/index.html      # 单文件原型，双击即可打开（无外部依赖）
├── PRD/PRD.md                 # 产品需求文档
├── design/
│   ├── 匹配算法设计.md         # 契合度模型与参数
│   ├── AI提示词设计.md         # 提示词、流式协议、降级策略
│   └── score-model.js         # 算法实现（node design/score-model.js 可直接跑）
└── server/
    ├── server.js              # 零依赖本地服务：静态托管 + SSE 代理
    ├── prompt.js              # 提示词构造（文档与代码共用同一份）
    └── .env.local             # 私密配置，已被 .gitignore 忽略
```

## 启动

```bash
node server/server.js    # 或 npm start
open http://localhost:8787
```

零依赖，不需要 `npm install`，Node 18+ 即可。

## 配置 AI

编辑 `server/.env.local`：

```ini
AI_BASE_URL=https://api.qnaigc.com/v1
AI_MODEL=deepseek/deepseek-v4.1-flash-1017
AI_API_KEY=sk-xxxxxxxx
```

- Key 只在服务端，前端拿不到。
- 命令行环境变量优先于 `.env.local`，便于临时切换。
- 不支持流式的模型会返回 400，见 `design/AI提示词设计.md` 9.1。

## 没有 Key 也能演示

直接双击 `高保真原型/index.html`，或访问服务但 Key 不可用时，页面会自动切到**本地模拟输出**，并在状态栏标注「演示模式」。算法结果、海报生成、交互流程全部可用。

## 排查

接入之前先确认 Key 能不能用（比在页面上试快得多）：

```bash
node server/check-key.js                          # 用 .env.local 的配置
node server/check-key.js sk-xxx                   # 指定 Key
node server/check-key.js sk-xxx deepseek-chat https://api.deepseek.com/v1
```

它会直接告诉你 HTTP 状态、上游原始错误和结论，退出码 0 表示可用、1 表示不可用。

服务运行时也可以查：

```bash
curl http://localhost:8787/api/ai/health
```

返回里的 `configured` 表示是否配了 Key，`lastError` 记录最近一次上游失败的原因（`status` / `hint` / `upstream`）。
