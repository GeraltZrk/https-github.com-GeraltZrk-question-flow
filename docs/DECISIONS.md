# Architecture decisions

## D1 — AI 含量来自核心职责

QuestionFlow 不增加聊天框。两个多模态阶段分别负责：

1. Question Compiler：跨图重建题目、字段与时间关系。
2. Evidence Critic：独立检查错拼、冲突、缺页、单位和符号问题。

## D2 — 证据不能由 Compiler 自己创建

`SourceRegion` 必须先由 OCR / 代码生成并冻结。Compiler 只能引用现有
`regionId`。进入 Step 2 前，代码验证：

- 所有 ID 唯一且引用存在
- imageId 属于本批图片
- bbox 在图片边界内
- cropHash 格式合法
- 数字可由 OCR 原文经白名单转换得到
- Question / Segment / Field / Timing 不串题

## D3 — Blocking 由代码决定

Critic 只返回 `Issue.code`、目标和证据，不返回 `blocking`。
`issuePolicy.ts` 是唯一阻断策略来源。

## D4 — 门禁按题目

所有 Field、Timing、Issue、Resolution 和 NpvPlan 都绑定 `questionId`。
Q14 缺页只能阻断 Q14；它仍显示在 Index，但不能阻断 Q13 导出。

## D5 — READY 不等于正确

`READY` 表示规则门禁通过。Step 3 必须展示关键输入摘要，用户确认后才能导出。

## D6 — 只支持 NPV_V1

NPV 由纯函数计算，Excel 公式由固定模板写入。MVP 只接受
`END_OF_PERIOD`；模型不能生成任意公式字符串。

## D7 — Fixture 必须透明

官方 Demo 才允许 fixture。未知图片分析失败时返回错误，不能静默套用 Demo。
正式 90 秒路演可以透明使用 `CACHED LIVE AI`，但不能口播成现场推理。
