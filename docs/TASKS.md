# 48 小时任务票

## 技术 A｜AI 与合同

- [ ] QF-AI-01：本地 OCR EvidenceBundle 与引用完整性
- [ ] QF-AI-02：Question Compiler 与严格 JSON 输出
- [ ] QF-AI-03：Evidence Critic 与 8 个 reason code
- [ ] QF-AI-04：缓存键、真实调用与失败模式

验收：5 图能稳定得到 q13 跨图关系；Critic 命中 6% / 8% 冲突和 Q14 缺页。

## 技术 B｜三步 UI

- [ ] QF-UI-01：上传、排序预览和分析状态
- [ ] QF-UI-02：Review 卡片与 SourceCrop
- [ ] QF-UI-03：Resolution 交互与逐题状态
- [ ] QF-UI-04：Step 3 关键输入确认、下载和状态徽标

验收：正常路径只有三屏；`LIVE / CACHED / FIXTURE / FAILED` 不混淆。

## 技术 C｜确定性运行时

- [ ] QF-RT-01：Issue Policy 与逐题状态
- [ ] QF-RT-02：Resolution / UserOverride
- [ ] QF-RT-03：NPV_V1 门禁和纯函数
- [ ] QF-RT-04：Index / Q13_NPV / Sources
- [ ] QF-RT-05：黄金测试和 Source Map

验收：q13 NPV 为 `153.08896001625754`；Q14 `MISSING` 不阻断 q13。

## 先后顺序

1. 三人共同冻结 `schema.ts` 和 `fixtures/demo.ts`。
2. A 接通 Compiler；B 做三步空壳；C 完成状态与 NPV。
3. A 接通 Critic；B 做冲突处理；C 做 XLSX。
4. 全员跑非 Demo 图片、错误路径和 90 秒彩排。
