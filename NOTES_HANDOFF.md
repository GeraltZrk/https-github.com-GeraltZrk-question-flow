# NOTES_HANDOFF.md — QF-AI-02/03 compiler + critic

**Branch**: `feat/qf-ai-02-compiler-critic`
**Commit**: `23c777b`
**Date**: 2026-07-25

## 完成了什么

### modelClient.ts
- `createOpenAIModel(modelName)` 实现 `StructuredModel` 接口
- 使用 OpenAI Chat Completions API，支持 vision (base64 image_url) + json_schema 结构化输出
- Key 从 `OPENAI_API_KEY` 服务端环境变量读取
- 默认模型：gpt-4o

### compiler.ts
- `compile(images, evidence)` → CaseIR，经 Zod + validateCaseIRReferences 双重校验
- D2：模型只能引用已有 regionId，不得新建证据
- 失败抛 CompilerError (VALIDATION_FAILED / REFERENCE_FAILED / MODEL_FAILED)

### critic.ts
- `critique(images, evidence, caseIR)` → Issue[]
- 每条 Issue 经 Zod 校验 + 引用完整性检查
- D3：模型返回的 blocking 字段一律忽略，blocking 由 issuePolicy.ts 计算

### route.ts
- fixture 模式保持原样
- live 模式：evidence → compile → critique → issuePolicy → LIVE_AI 响应
- 任一步失败返回 ANALYSIS_FAILED (非 200)

### 测试
- `compiler-critic.test.ts`：9 个 mock 测试
  - 合法 CaseIR 通过
  - 引用不存在 regionId 被拒
  - 跨 questionId 字段被拒
  - 模型返回 invalid schema 被拒
  - Critic 跳过无效引用 issue
  - D3：blocking 由 issuePolicy 计算

## 验证结果

```
npm run check
  lint        PASS
  typecheck   PASS
  test        5 files, 35 tests  PASS
  build       PASS
```

## 新增/改动文件

| 文件 | 状态 |
|------|------|
| `src/ai/modelClient.ts` | 新增 |
| `src/ai/compiler.ts` | 新增 |
| `src/ai/critic.ts` | 新增 |
| `src/app/api/analyze/route.ts` | 修改 (live mode) |
| `src/tests/compiler-critic.test.ts` | 新增 |
| `.env.local` | 新增 (已 gitignore) |
| `package.json` / `package-lock.json` | 新增 zod-to-json-schema 依赖 |

## Live 冒烟

**未完成**：缺少 `public/demo/` 下的 5 张官方 demo 图片。Zod 校验需要模型输出后验证，当前 mock 测试覆盖了校验逻辑。

实现已就位：设 `QUESTIONFLOW_MODE=live` 即可触发真调用。

## 选用的模型

- 默认：**gpt-4o**（多模态 + 视觉 + JSON 结构化输出）
- 可通过 `QUESTIONFLOW_COMPILER_MODEL` / `QUESTIONFLOW_CRITIC_MODEL` 覆盖

## 待办

1. **真实 OCR preflight**：当前 `generateDemoEvidence()` 返回 fixture，需接 Tesseract.js
2. **cropHash 回算**：当前固定占位值
3. **live 冒烟**：需 `public/demo/` 下 5 张 demo 图
4. **QF-AI-04 缓存**：按图片哈希+版本缓存成功的真实结果
5. **UI 线**：三步 UI 需消费 live API 响应
6. **补齐 14 黄金测试**
