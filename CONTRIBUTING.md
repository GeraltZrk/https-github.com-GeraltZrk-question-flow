# Contributing

## 三人分工

- 技术 A｜AI：`src/ai`、`api/analyze`、Evidence / CaseIR / Issue Schema、Compiler / Critic。
- 技术 B｜前端：三步 UI、Review 卡片、SourceCrop、Reducer、状态徽标。
- 技术 C｜运行时：逐题门禁、Resolution、NPV_V1、xlsx、Source Map、黄金测试。
- 全员：真实截图测试、失败路径、90 秒 Demo 与录屏。

Schema 变更由技术 A 先合并；其他模块只依赖已合并的数据合同。

## 分支

`main` 必须始终可运行，团队接入远端后应开启分支保护并禁止直接 push。

一张任务票一个分支：

```text
feat/qf-ai-01-evidence
feat/qf-ui-04-upload
feat/qf-runtime-06-npv
fix/<short-name>
```

## Pull Request

每个 PR 必须：

1. 写明任务票、改动范围和验收结果。
2. UI 变更附截图；AI 变更附脱敏 JSON 样例。
3. 通过 `npm run check`。
4. 不提交密钥、真实用户截图或未脱敏数据。
5. 至少一名非作者 Review 后 squash merge。

禁止在黑客松 MVP 中加入聊天、多题型、RAG、多 Agent 循环、任意公式生成或静默 fixture。

## 接口变更

修改 `src/domain/schema.ts` 时，PR 必须同时更新：

- `src/fixtures/demo.ts`
- 受影响测试
- `docs/DECISIONS.md`

不得只改类型而不更新 fixture 和测试。
