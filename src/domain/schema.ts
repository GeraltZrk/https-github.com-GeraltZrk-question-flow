import { z } from "zod";

const Id = z.string().min(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 hex string");

export const BBoxSchema = z
  .object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().positive(),
    h: z.number().positive(),
  })
  .strict();

export const SourceImageSchema = z
  .object({
    id: Id,
    fileName: z.string().min(1),
    sha256: Sha256,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

export const SourceRegionSchema = z
  .object({
    id: Id,
    imageId: Id,
    bbox: BBoxSchema,
    rawText: z.string().min(1),
    cropHash: Sha256,
  })
  .strict();

export const EvidenceBundleSchema = z
  .object({
    batchHash: Sha256,
    images: z.array(SourceImageSchema).min(1).max(5),
    regions: z.array(SourceRegionSchema).min(1),
  })
  .strict();

export const QuestionSchema = z
  .object({
    id: Id,
    questionNo: z.number().int().positive().optional(),
    segmentIds: z.array(Id).min(1),
  })
  .strict();

export const SegmentSchema = z
  .object({
    id: Id,
    questionId: Id,
    regionIds: z.array(Id).min(1),
    requiredContinuation: z.boolean(),
  })
  .strict();

export const FieldCandidateSchema = z
  .object({
    id: Id,
    questionId: Id,
    segmentId: Id,
    key: z.enum(["initialInvestment", "discountRate", "cashFlow"]),
    period: z.number().int().positive().optional(),
    normalized: z.number().finite(),
    unit: z.enum(["USD", "ratio"]),
    regionIds: z.array(Id).min(1),
    transformRule: z
      .enum(["INITIAL_COST_TO_NEGATIVE", "PERCENT_TO_RATIO"])
      .optional(),
  })
  .strict()
  .superRefine((field, ctx) => {
    if (field.key === "cashFlow" && field.period === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "cashFlow requires period",
        path: ["period"],
      });
    }
    if (field.key !== "cashFlow" && field.period !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Only cashFlow may include period",
        path: ["period"],
      });
    }
    if (field.key === "discountRate" && field.unit !== "ratio") {
      ctx.addIssue({
        code: "custom",
        message: "discountRate must use ratio",
        path: ["unit"],
      });
    }
    if (field.key !== "discountRate" && field.unit !== "USD") {
      ctx.addIssue({
        code: "custom",
        message: "Money fields must use USD",
        path: ["unit"],
      });
    }
  });

export const TimingCandidateSchema = z
  .object({
    id: Id,
    questionId: Id,
    value: z.enum(["END_OF_PERIOD", "BEGINNING_OF_PERIOD", "UNRESOLVED"]),
    regionIds: z.array(Id),
  })
  .strict();

export const RelationSchema = z
  .object({
    from: Id,
    to: Id,
    type: z.enum([
      "continues",
      "supports",
      "conflicts_with",
      "normalized_to",
      "feeds",
    ]),
  })
  .strict();

export const CaseIRSchema = z
  .object({
    schemaVersion: z.literal("case-ir.v1"),
    questions: z.array(QuestionSchema).min(1),
    segments: z.array(SegmentSchema).min(1),
    fields: z.array(FieldCandidateSchema),
    timings: z.array(TimingCandidateSchema),
    relations: z.array(RelationSchema),
  })
  .strict();

export const IssueCodeSchema = z.enum([
  "UNSUPPORTED_VALUE",
  "WRONG_ROLE",
  "WRONG_MERGE",
  "CONFLICTING_VALUE",
  "AMBIGUOUS_TIME_OR_SIGN",
  "AMBIGUOUS_UNIT",
  "ORPHAN_FRAGMENT",
  "MISSING_CONTINUATION",
]);

export const IssueSchema = z
  .object({
    id: Id,
    questionId: Id,
    code: IssueCodeSchema,
    targetIds: z.array(Id).min(1),
    regionIds: z.array(Id),
    message: z.string().min(1).max(160),
  })
  .strict();

const ResolutionBase = {
  id: Id,
  questionId: Id,
  issueId: Id,
  createdAt: z.string().datetime(),
};

export const ResolutionSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...ResolutionBase,
      action: z.literal("SELECT_CANDIDATE"),
      selectedFieldId: Id,
    })
    .strict(),
  z
    .object({
      ...ResolutionBase,
      action: z.literal("MANUAL_VALUE"),
      overrideId: Id,
    })
    .strict(),
  z
    .object({
      ...ResolutionBase,
      action: z.literal("SPLIT_SEGMENT"),
      segmentId: Id,
    })
    .strict(),
  z
    .object({
      ...ResolutionBase,
      action: z.literal("EXCLUDE_QUESTION"),
    })
    .strict(),
]);

export const UserOverrideSchema = z
  .object({
    id: Id,
    questionId: Id,
    key: z.enum(["initialInvestment", "discountRate", "cashFlow"]),
    period: z.number().int().positive().optional(),
    newValue: z.number().finite(),
    unit: z.enum(["USD", "ratio"]),
    reason: z.string().min(1),
    createdAt: z.string().datetime(),
  })
  .strict();

export type BBox = z.infer<typeof BBoxSchema>;
export type SourceImage = z.infer<typeof SourceImageSchema>;
export type SourceRegion = z.infer<typeof SourceRegionSchema>;
export type EvidenceBundle = z.infer<typeof EvidenceBundleSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type FieldCandidate = z.infer<typeof FieldCandidateSchema>;
export type TimingCandidate = z.infer<typeof TimingCandidateSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type CaseIR = z.infer<typeof CaseIRSchema>;
export type IssueCode = z.infer<typeof IssueCodeSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Resolution = z.infer<typeof ResolutionSchema>;
export type UserOverride = z.infer<typeof UserOverrideSchema>;

export type QuestionStatus =
  | "READY"
  | "REVIEW"
  | "CONFLICT"
  | "MISSING"
  | "EXCLUDED";

export type AnalyzeMode = "LIVE_AI" | "CACHED_LIVE_AI" | "DEMO_FIXTURE";
