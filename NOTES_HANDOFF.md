# NOTES_HANDOFF.md — QF-AI-01 preflight

**Branch**: `feat/qf-ai-01-preflight`
**Commit**: `8e0ac6f`
**Date**: 2026-07-25

## 完成了什么

- 新建 `src/domain/evidencePreflight.ts`：
  - `generateDemoEvidence()` — 与本仓库 `fixtures/demo.ts` 一致的冻结 EvidenceBundle。
  - `validateFieldTransform()` — 字段值白名单转换（PERCENT_TO_RATIO、INITIAL_COST_TO_NEGATIVE、NONE），虚构/找不到证据的数字返回 false。
- 新建 `src/tests/evidencePreflight.test.ts`：16 个测试覆盖 Region 结构校验、白名单转换正确性、虚构数字拒收。

## 验证结果

```
npm run check
  lint        PASS
  typecheck   PASS
  test        4 files, 26 tests (16 new + 10 baseline)  PASS
  build       PASS
```

## 改了哪些文件

| 文件 | 状态 |
|------|------|
| `src/domain/evidencePreflight.ts` | 新增 |
| `src/tests/evidencePreflight.test.ts` | 新增 |

未修改 `schema.ts`、`fixtures/demo.ts` 或任何既有文件。

## 遇到的问题

无。

## 下一轮待做

1. **cropHash 真实回算测试**：当前 cropHash 使用固定占位值，真实实现需要从图片裁剪区域计算 SHA-256。
2. **补齐到 14 个黄金测试**：当前仓库有 26 个测试（10 基线 + 16 新增），还需 QF-RT-05 的完整 14 黄金测试套件。
3. **模型选型**：Compiler/Critic 需要多模态模型，DeepSeek 不支持图片输入，需在 OpenAI GPT-4o / Claude / Gemini 中选定。
4. **Tesseract.js 接入**：`generateDemoEvidence()` 当前只返回 fixture 数据；生产路径需要跑 Tesseract 生成真实的 SourceRegion[]。
