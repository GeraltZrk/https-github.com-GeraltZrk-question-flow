# QuestionFlow 开发约定

这个仓库面向 48 小时黑客松协作。开始改代码前，先读：

- `README.md`：产品边界与启动方法
- `docs/TASKS.md`：三条并行任务线
- `docs/DECISIONS.md`：不能被隐式推翻的架构决策
- `CONTRIBUTING.md`：分支、PR 和接口变更规则

## 常用命令

```bash
npm ci
npm run dev
npm run check
```

统一使用 Node.js 20 或更高版本；提交前必须通过 `npm run check`。

## 模块边界

- `src/ai`：只负责模型输入输出、Prompt 和供应商适配。
- `src/domain`：只放确定性规则、数据合同、校验、NPV 和 XLSX。
- `src/app`：页面、交互与 API 路由。
- `src/fixtures`：透明、可复现的官方 Demo 数据。

AI 不得直接决定是否阻断、生成 Excel 公式或创建证据区域。代码必须验证所有
AI 输出；`src/domain/schema.ts` 是模块间唯一数据合同。

## 并行开发

- AI 线尽量只改 `src/ai` 和 `src/app/api/analyze`。
- UI 线尽量只改 `src/app`、`src/components` 和 `src/state`。
- Runtime 线尽量只改 `src/domain`、导出逻辑和测试。
- 如需修改 Schema，先单独提交 Schema、fixture 和测试，再让其他分支同步。

一个任务票一个小 PR。不要提交 `.env.local`、API Key、真实用户截图、生成目录
或未脱敏模型输出。
