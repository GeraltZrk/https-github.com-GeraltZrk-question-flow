# NOTES_HANDOFF.md — QF-UI-01~04 three-step UI

**Branch**: `feat/qf-ui-01-flow`
**Commit**: `107cbae`
**Date**: 2026-07-25

## 完成了什么

### 状态徽标 (QF-UI-01)
- `components/AnalysisBadge.tsx` — 四态徽标 LIVE_AI / CACHED_LIVE_AI / DEMO_FIXTURE / ANALYSIS_FAILED

### Step 1 上传 (QF-UI-01)
- `components/UploadStep.tsx` — "Load Demo Set" 按钮，模拟 400ms 延迟，直接载入 fixture 黄金数据
- 保留 Choose Files 占位按钮供后续真实上传

### Step 2 Review (QF-UI-02/03)
- `components/ReviewStep.tsx` — 四态卡片 READY(绿) / REVIEW(黄) / CONFLICT(红) / MISSING(灰)
- `components/SourceCrop.tsx` — 展示 bbox + rawText，标注"待真实 demo 图接入裁片"
- 冲突解决：CONFLICT 状态显示两候选按钮，点击 SELECT_CANDIDATE 后变 READY
- 缺页处理：MISSING 状态显示 Exclude 按钮（D4: q14 不阻断 q13）
- 门禁：用 issuePolicy 判定，有未解决 blocking 时 Next 禁用 + 显示剩余数量

### Step 3 Build & Export (QF-UI-04)
- `components/BuildStep.tsx` — NPV 工作区
- 展示 Key Inputs Summary + Source Evidence + NPV Result (153.09)
- D5：先确认"已核对，生成 Excel"，然后下载 XLSX
- 导出 Index / Q13_NPV / Sources（用 workbook.ts）

### 状态管理
- `state/reducer.ts` — useReducer 管理全状态：LOAD_ANALYSIS → ADD_RESOLUTION → CONFIRM_QUESTION → COMPUTE_NPV

## 验证结果

```
npm run check
  lint:    PASS (0 errors, 1 pre-existing warning)
  tsc:     PASS
  test:    5 files, 36 tests PASS
  build:   PASS
```

浏览器 fixture 流程：Load Demo → Q13 CONFLICT / Q14 MISSING → 选 8% → Q13 READY → Step3 确认 → 下载 XLSX。

## 新增/改动文件

| 文件 | 状态 |
|------|------|
| `src/state/reducer.ts` | 新增 |
| `src/components/AnalysisBadge.tsx` | 新增 |
| `src/components/UploadStep.tsx` | 新增 |
| `src/components/ReviewStep.tsx` | 新增 |
| `src/components/SourceCrop.tsx` | 新增 |
| `src/components/BuildStep.tsx` | 新增 |
| `src/app/page.tsx` | 重写 |

未改动 src/domain、src/ai、schema.ts、route.ts。

## 待办

1. **SourceCrop 真实裁片**：当前只展示 bbox+rawText，待 public/demo/ 有真实 demo 图片后实现按 bbox 裁剪高亮
2. **iPhone 375px 适配**：当前主要桌面宽度可操作，窄屏需要额外 CSS 调整
3. **真实上传**：Choose Files 按钮 + FormData + /api/analyze POST
4. **Q14 MISSING 补图路径**：当前只有 Exclude，后续可加"补图上传"后重新分析
