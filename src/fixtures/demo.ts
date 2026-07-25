import {
  CaseIRSchema,
  EvidenceBundleSchema,
  IssueSchema,
  ResolutionSchema,
} from "@/domain/schema";

const sha = (character: string) => character.repeat(64);

export const demoEvidence = EvidenceBundleSchema.parse({
  batchHash: sha("a"),
  images: [
    {
      id: "img01",
      fileName: "IMG_01.png",
      sha256: sha("1"),
      width: 1000,
      height: 1000,
    },
    {
      id: "img02",
      fileName: "IMG_02.png",
      sha256: sha("2"),
      width: 1000,
      height: 1000,
    },
    {
      id: "img03",
      fileName: "IMG_03.png",
      sha256: sha("3"),
      width: 1000,
      height: 1000,
    },
    {
      id: "img04",
      fileName: "IMG_04.png",
      sha256: sha("4"),
      width: 1000,
      height: 1000,
    },
    {
      id: "img05",
      fileName: "IMG_05.png",
      sha256: sha("5"),
      width: 1000,
      height: 1000,
    },
  ],
  regions: [
    {
      id: "r01",
      imageId: "img01",
      bbox: { x: 100, y: 100, w: 700, h: 220 },
      rawText: "$450 in year 2 and $500 in year 3; discount rate is 8%",
      cropHash: sha("b"),
    },
    {
      id: "r02",
      imageId: "img02",
      bbox: { x: 80, y: 90, w: 780, h: 240 },
      rawText: "Question 14: use the data table on the next page",
      cropHash: sha("c"),
    },
    {
      id: "r03",
      imageId: "img03",
      bbox: { x: 120, y: 100, w: 650, h: 180 },
      rawText: "discount rate is 6%",
      cropHash: sha("d"),
    },
    {
      id: "r04",
      imageId: "img04",
      bbox: { x: 90, y: 80, w: 800, h: 260 },
      rawText: "Question 13 costs $1,000 today and pays $400 in year 1",
      cropHash: sha("e"),
    },
    {
      id: "r05",
      imageId: "img05",
      bbox: { x: 110, y: 120, w: 690, h: 160 },
      rawText: "all cash flows occur at year-end",
      cropHash: sha("f"),
    },
  ],
});

export const demoCaseIR = CaseIRSchema.parse({
  schemaVersion: "case-ir.v1",
  questions: [
    { id: "q13", questionNo: 13, segmentIds: ["s01", "s03", "s04", "s05"] },
    { id: "q14", questionNo: 14, segmentIds: ["s02"] },
  ],
  segments: [
    {
      id: "s01",
      questionId: "q13",
      regionIds: ["r01"],
      requiredContinuation: false,
    },
    {
      id: "s02",
      questionId: "q14",
      regionIds: ["r02"],
      requiredContinuation: true,
    },
    {
      id: "s03",
      questionId: "q13",
      regionIds: ["r03"],
      requiredContinuation: false,
    },
    {
      id: "s04",
      questionId: "q13",
      regionIds: ["r04"],
      requiredContinuation: false,
    },
    {
      id: "s05",
      questionId: "q13",
      regionIds: ["r05"],
      requiredContinuation: false,
    },
  ],
  fields: [
    {
      id: "f_rate_8",
      questionId: "q13",
      segmentId: "s01",
      key: "discountRate",
      normalized: 0.08,
      unit: "ratio",
      regionIds: ["r01"],
      transformRule: "PERCENT_TO_RATIO",
    },
    {
      id: "f_rate_6",
      questionId: "q13",
      segmentId: "s03",
      key: "discountRate",
      normalized: 0.06,
      unit: "ratio",
      regionIds: ["r03"],
      transformRule: "PERCENT_TO_RATIO",
    },
    {
      id: "f_initial",
      questionId: "q13",
      segmentId: "s04",
      key: "initialInvestment",
      normalized: -1000,
      unit: "USD",
      regionIds: ["r04"],
      transformRule: "INITIAL_COST_TO_NEGATIVE",
    },
    {
      id: "f_y1",
      questionId: "q13",
      segmentId: "s04",
      key: "cashFlow",
      period: 1,
      normalized: 400,
      unit: "USD",
      regionIds: ["r04"],
    },
    {
      id: "f_y2",
      questionId: "q13",
      segmentId: "s01",
      key: "cashFlow",
      period: 2,
      normalized: 450,
      unit: "USD",
      regionIds: ["r01"],
    },
    {
      id: "f_y3",
      questionId: "q13",
      segmentId: "s01",
      key: "cashFlow",
      period: 3,
      normalized: 500,
      unit: "USD",
      regionIds: ["r01"],
    },
  ],
  timings: [
    {
      id: "t_q13",
      questionId: "q13",
      value: "END_OF_PERIOD",
      regionIds: ["r05"],
    },
    {
      id: "t_q14",
      questionId: "q14",
      value: "UNRESOLVED",
      regionIds: [],
    },
  ],
  relations: [
    { from: "s01", to: "q13", type: "continues" },
    { from: "s03", to: "q13", type: "continues" },
    { from: "f_rate_6", to: "f_rate_8", type: "conflicts_with" },
    { from: "t_q13", to: "q13", type: "supports" },
  ],
});

export const demoIssues = IssueSchema.array().parse([
  {
    id: "issue_rate_conflict",
    questionId: "q13",
    code: "CONFLICTING_VALUE",
    targetIds: ["f_rate_6", "f_rate_8"],
    regionIds: ["r01", "r03"],
    message: "Q13 discount rate has supported 6% and 8% candidates.",
  },
  {
    id: "issue_q14_missing",
    questionId: "q14",
    code: "MISSING_CONTINUATION",
    targetIds: ["s02"],
    regionIds: ["r02"],
    message: "Q14 requires a continuation page that is not present.",
  },
]);

export const demoSelectEightPercent = ResolutionSchema.parse({
  id: "resolution_rate_8",
  questionId: "q13",
  issueId: "issue_rate_conflict",
  action: "SELECT_CANDIDATE",
  selectedFieldId: "f_rate_8",
  createdAt: "2026-07-25T00:00:00.000Z",
});
