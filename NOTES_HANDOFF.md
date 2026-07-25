# NOTES_HANDOFF.md — 枝见 Branchline init

**Date**: 2026-07-25

## 做了什么

### Step 0 · 数据合同
- `src/domain/schema.ts` — UserInput, Choice, Candidate, Judgment, Ranking, Adjustment, FinalResult, SessionRecord
- 全部 Zod `.strict()`

### Step 1 · 黄金案例
- `src/fixtures/demoCase.ts` — 选课决策: cand-viz > cand-biz > cand-ml
- 7 条输入 + 3 条判断 + 黄金最终结果

### Step 2 · 确定性地基
- `integrity.ts` — 证据引用 / factIds 校验
- `status.ts` — recommended / backup / not_recommended / insufficient_info
- `rerank.ts` — applyAdjustment(reject/modify/keep) + computeFinalResult
- `session.ts` — SessionRecord CRUD
- `app/api/decide/route.ts` — fixture 模式返回 DEMO_SESSION
- `ai/ranker.ts` — mock ranker（返回 DEMO_RANKING）
- `tests/demo.test.ts` — 11 tests

### Step 4 · 三页 UI
- `state/reducer.ts` — useReducer 管理三步骤
- `components/Badge.tsx` — demo/live/cached/failed 四态徽标
- `components/Step1Input.tsx` — 载入示例按钮
- `components/Step2Compare.tsx` — 排序卡片 + 保留/拒绝/修改操作
- `components/Step3Result.tsx` — 唯一建议 + whyForUser + nextStep
- `app/page.tsx` — 三页 stepper

### Step 3 · AI 层
- `ai/ranker.ts` — mock 模式就位，live 待接

## 验证

```
npm run check: 1 test file, 11 tests PASS
tsc --noEmit: PASS
build: PASS
```

浏览器 fixture 流程: 载入示例 → 三候选排序(推荐cand-viz) → 拒绝/保留/修改 → 最终建议 + 下一步。

## 待办

1. 接 OpenAI live: 设 OPENAI_API_KEY + 开启 live 模式
2. 提示词细化: 铁律"不给不基于证据的建议"/"冲突不能擅自选"写进 system prompt
3. iPhone 375px 适配: 当前卡片宽度≥375 无横滚但可进一步优化
4. 真人验证: PRD 3.10 找 3 人试跑
