# QuestionFlow AI

把乱序、缺页、冲突的 Finance 题目截图，编译成证据可追溯的 NPV Excel。

AI 负责重建题目与审计证据；代码负责状态门禁、NPV 和 Excel；用户只处理无法确定的问题。

> No evidence, no formula.

## 当前仓库状态

这是可运行的黑客松开工骨架，已经包含：

- Next.js 16 + TypeScript + ESLint
- Zod 数据合同和引用完整性检查
- 逐题状态、Resolution 和 NPV_V1 纯函数
- 官方 Demo fixture 与黄金测试
- `/api/analyze` 的安全占位接口
- 三人分工、分支规则和 PR 模板

AI 模型客户端尚未接线；技术 A 从 `src/ai` 和 `src/app/api/analyze` 开始。

## 三步体验

1. 上传：最多 5 张 JPG / PNG，先冻结 OCR 证据，再由 AI 重建题目关系。
2. 确认：只处理 `REVIEW / CONFLICT / MISSING`。
3. 构建：用户核对关键输入后，导出 `Index / Q13_NPV / Sources`。

MVP 只支持 `NPV_V1`，不做聊天、通用解题、RAG、多 Agent 循环或模型生成公式。

## 本地启动

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

打开 <http://localhost:3000>。

需要 Node.js `>=20.9.0`；仓库的 `.nvmrc` 固定主版本为 Node 20。

测试工具链固定为 `Vitest 3 + Vite 6`，兼容团队现有的 Node 20 环境。请使用
`npm ci` 严格按仓库锁文件安装，不要单独升级 Vitest 或 Vite。

Windows 如果曾经安装失败并出现 `win32 binding` 缺失，请在 PowerShell 中删除
旧的 `node_modules` 后重新安装：

```powershell
Remove-Item -Recurse -Force node_modules
npm cache verify
npm ci
```

提交前统一运行：

```bash
npm run check
```

也可以单独运行：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 环境变量

参考 `.env.example`：

```env
QUESTIONFLOW_MODE=fixture
OPENAI_API_KEY=
QUESTIONFLOW_COMPILER_MODEL=
QUESTIONFLOW_CRITIC_MODEL=
```

`OPENAI_API_KEY` 只能在服务端读取，禁止添加 `NEXT_PUBLIC_` 前缀。

## 分析模式

- `live`：真实调用两个多模态阶段，界面显示 `LIVE AI`。
- `fixture`：只加载官方 Demo 数据，界面显示 `DEMO FIXTURE`。
- 缓存：真实运行成功后可按图片哈希和版本读取，显示 `CACHED LIVE AI`。
- 未知图片分析失败：必须显示 `ANALYSIS FAILED`，禁止静默套用 fixture。

当前 `/api/analyze` 在 `fixture` 模式返回黄金数据；`live` 模式返回
`501 AI_NOT_WIRED`，直到技术 A 接入模型客户端。

## 核心边界

```text
原图
→ 本地 OCR / 代码生成不可变 SourceRegion
→ AI ① Question Compiler 只引用 Region
→ 引用完整性检查
→ AI ② Evidence Critic 只返回 Issue
→ 代码按题目门禁
→ 用户确认
→ NPV_V1 + XLSX
```

- Critic 不得输出 `blocking`；阻断策略由代码决定。
- Q14 的 `MISSING` 不得阻断 Q13。
- 选择已有候选写 `Resolution`；真正手输新值才写 `UserOverride`。
- `READY` 只代表规则门禁通过，不代表答案一定正确。

## 目录

```text
src/
  ai/             # 模型边界、prompt 与供应商适配层
  app/            # 页面与 /api/analyze
  domain/         # Schema、引用校验、状态、NPV
  fixtures/       # 官方 Demo 黄金数据
docs/             # 技术决策与任务票
```

完整开工顺序见 `docs/TASKS.md`，协作规则见 `CONTRIBUTING.md`。
