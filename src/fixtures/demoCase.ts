import { ChoiceSchema, UserInputSchema, CandidateSchema, RankingSchema, FinalResultSchema, type SessionRecord } from "@/domain/schema";
export const DEMO_CHOICE = ChoiceSchema.parse({ question: "这学期选哪门选修课" });
export const DEMO_INPUTS = UserInputSchema.array().parse([
  { id:"g1", kind:"goal", text:"想转产品经理岗" },
  { id:"i1", kind:"interest", text:"喜欢把数据讲成故事" },
  { id:"e1", kind:"experience", text:"写过前端，没系统学过 ML" },
  { id:"c1", kind:"constraint", text:"这学期还有两门硬课，时间紧" },
  { id:"f1", kind:"candidateFact", text:"数据可视化: 作业含 3 次大屏项目，偏独立完成" },
  { id:"f2", kind:"candidateFact", text:"创业与商业模式: 每周小组讨论，期末交商业计划书" },
  { id:"f3", kind:"candidateFact", text:"机器学习导论: 每周编程作业+期中大作业，需要 Python 基础" },
]);
export const DEMO_CANDIDATES = CandidateSchema.array().parse([
  { id:"cand-viz", name:"数据可视化", factIds:["f1"] },
  { id:"cand-biz", name:"创业与商业模式", factIds:["f2"] },
  { id:"cand-ml", name:"机器学习导论", factIds:["f3"] },
]);
export const DEMO_RANKING = RankingSchema.parse({
  orderedCandidateIds: ["cand-viz","cand-biz","cand-ml"], recommendedId:"cand-viz",
  judgments: [
    { id:"j1", candidateId:"cand-viz", personalMatch:"high", feasibility:"high", cost:"low", risk:"low", evidenceIds:["i1","g1","e1"] },
    { id:"j2", candidateId:"cand-biz", personalMatch:"high", feasibility:"med", cost:"med", risk:"low", evidenceIds:["g1","f2"] },
    { id:"j3", candidateId:"cand-ml", personalMatch:"low", feasibility:"low", cost:"high", risk:"high", evidenceIds:["e1","c1","f3"] },
  ],
});
export const DEMO_FINAL = FinalResultSchema.parse({
  recommendedCandidateId:"cand-viz",
  whyForUser:"数据可视化最匹配你的产品经理目标(g1)和数据叙事兴趣(i1)。你有前端基础(e1)，入门成本低。",
  howAdjustmentChanged:"初次分析基于你时间紧(c1)的约束排序。如果你调整了时间约束，结果会相应变化。",
  mainCost:"时间投入低——作业偏独立完成",
  missingEvidence:"未确认该课是否有产品设计相关项目",
  nextStep:"在选课系统加入「数据可视化」，并找授课老师确认作业方向",
});
export const DEMO_SESSION: SessionRecord = { inputs: DEMO_INPUTS, initialRanking: DEMO_RANKING, adjustments:[], finalResult: DEMO_FINAL };
