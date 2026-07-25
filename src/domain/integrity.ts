import type {
  CaseIR,
  EvidenceBundle,
  FieldCandidate,
  Issue,
} from "./schema";

export type IntegrityCode =
  | "DUPLICATE_ID"
  | "UNKNOWN_IMAGE"
  | "BBOX_OUT_OF_BOUNDS"
  | "UNKNOWN_REFERENCE"
  | "CROSS_QUESTION_REFERENCE"
  | "UNSUPPORTED_NORMALIZED_VALUE";

export type IntegrityError = {
  code: IntegrityCode;
  message: string;
  id?: string;
};

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) duplicateIds.add(id);
    seen.add(id);
  }

  return [...duplicateIds];
}

function extractNumbers(text: string): number[] {
  return [...text.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)]
    .map((match) => Number(match[0].replaceAll(",", "")))
    .filter(Number.isFinite);
}

function approximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9;
}

function candidateCanComeFromText(
  field: FieldCandidate,
  rawText: string,
): boolean {
  const numbers = extractNumbers(rawText);

  return numbers.some((number) => {
    if (field.transformRule === "INITIAL_COST_TO_NEGATIVE") {
      return approximatelyEqual(-Math.abs(number), field.normalized);
    }
    if (field.transformRule === "PERCENT_TO_RATIO") {
      return approximatelyEqual(number / 100, field.normalized);
    }
    return approximatelyEqual(number, field.normalized);
  });
}

export function validateCaseIRReferences(
  evidence: EvidenceBundle,
  caseIR: CaseIR,
): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const imageById = new Map(evidence.images.map((image) => [image.id, image]));
  const regionById = new Map(
    evidence.regions.map((region) => [region.id, region]),
  );
  const questionIds = new Set(caseIR.questions.map((question) => question.id));
  const segmentById = new Map(
    caseIR.segments.map((segment) => [segment.id, segment]),
  );
  const fieldIds = new Set(caseIR.fields.map((field) => field.id));
  const timingIds = new Set(caseIR.timings.map((timing) => timing.id));

  const allIds = [
    ...evidence.images.map((image) => image.id),
    ...evidence.regions.map((region) => region.id),
    ...caseIR.questions.map((question) => question.id),
    ...caseIR.segments.map((segment) => segment.id),
    ...caseIR.fields.map((field) => field.id),
    ...caseIR.timings.map((timing) => timing.id),
  ];

  for (const id of duplicates(allIds)) {
    errors.push({
      code: "DUPLICATE_ID",
      id,
      message: `Duplicate ID: ${id}`,
    });
  }

  for (const region of evidence.regions) {
    const image = imageById.get(region.imageId);
    if (!image) {
      errors.push({
        code: "UNKNOWN_IMAGE",
        id: region.id,
        message: `${region.id} references unknown image ${region.imageId}`,
      });
      continue;
    }

    const { x, y, w, h } = region.bbox;
    if (x + w > image.width || y + h > image.height) {
      errors.push({
        code: "BBOX_OUT_OF_BOUNDS",
        id: region.id,
        message: `${region.id} bbox exceeds ${image.id}`,
      });
    }
  }

  for (const question of caseIR.questions) {
    for (const segmentId of question.segmentIds) {
      const segment = segmentById.get(segmentId);
      if (!segment) {
        errors.push({
          code: "UNKNOWN_REFERENCE",
          id: question.id,
          message: `${question.id} references unknown segment ${segmentId}`,
        });
      } else if (segment.questionId !== question.id) {
        errors.push({
          code: "CROSS_QUESTION_REFERENCE",
          id: question.id,
          message: `${segmentId} belongs to ${segment.questionId}, not ${question.id}`,
        });
      }
    }
  }

  for (const segment of caseIR.segments) {
    if (!questionIds.has(segment.questionId)) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: segment.id,
        message: `${segment.id} references unknown question ${segment.questionId}`,
      });
    }
    for (const regionId of segment.regionIds) {
      if (!regionById.has(regionId)) {
        errors.push({
          code: "UNKNOWN_REFERENCE",
          id: segment.id,
          message: `${segment.id} references unknown region ${regionId}`,
        });
      }
    }
  }

  for (const field of caseIR.fields) {
    const segment = segmentById.get(field.segmentId);
    if (!questionIds.has(field.questionId) || !segment) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: field.id,
        message: `${field.id} references an unknown question or segment`,
      });
    } else if (segment.questionId !== field.questionId) {
      errors.push({
        code: "CROSS_QUESTION_REFERENCE",
        id: field.id,
        message: `${field.id} and ${field.segmentId} have different questionIds`,
      });
    }

    const referencedRegions = field.regionIds
      .map((regionId) => regionById.get(regionId))
      .filter((region) => region !== undefined);

    if (referencedRegions.length !== field.regionIds.length) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: field.id,
        message: `${field.id} references an unknown region`,
      });
    } else if (
      !referencedRegions.some((region) =>
        candidateCanComeFromText(field, region.rawText),
      )
    ) {
      errors.push({
        code: "UNSUPPORTED_NORMALIZED_VALUE",
        id: field.id,
        message: `${field.id} cannot be derived from its OCR regions`,
      });
    }
  }

  for (const timing of caseIR.timings) {
    if (!questionIds.has(timing.questionId)) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: timing.id,
        message: `${timing.id} references unknown question ${timing.questionId}`,
      });
    }
    if (timing.regionIds.some((regionId) => !regionById.has(regionId))) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: timing.id,
        message: `${timing.id} references an unknown region`,
      });
    }
  }

  const validRelationIds = new Set([
    ...regionById.keys(),
    ...questionIds,
    ...segmentById.keys(),
    ...fieldIds,
    ...timingIds,
  ]);

  for (const relation of caseIR.relations) {
    if (
      !validRelationIds.has(relation.from) ||
      !validRelationIds.has(relation.to)
    ) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        message: `Relation ${relation.from} → ${relation.to} is dangling`,
      });
    }
  }

  return errors;
}

export function validateIssueReferences(
  evidence: EvidenceBundle,
  caseIR: CaseIR,
  issues: Issue[],
): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const questionIds = new Set(caseIR.questions.map((question) => question.id));
  const regionIds = new Set(evidence.regions.map((region) => region.id));
  const targetQuestionById = new Map<string, string>();

  for (const segment of caseIR.segments) {
    targetQuestionById.set(segment.id, segment.questionId);
  }
  for (const field of caseIR.fields) {
    targetQuestionById.set(field.id, field.questionId);
  }
  for (const timing of caseIR.timings) {
    targetQuestionById.set(timing.id, timing.questionId);
  }
  for (const question of caseIR.questions) {
    targetQuestionById.set(question.id, question.id);
  }

  for (const issue of issues) {
    if (!questionIds.has(issue.questionId)) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: issue.id,
        message: `${issue.id} references unknown question ${issue.questionId}`,
      });
    }

    for (const targetId of issue.targetIds) {
      const targetQuestionId = targetQuestionById.get(targetId);
      if (!targetQuestionId) {
        errors.push({
          code: "UNKNOWN_REFERENCE",
          id: issue.id,
          message: `${issue.id} references unknown target ${targetId}`,
        });
      } else if (targetQuestionId !== issue.questionId) {
        errors.push({
          code: "CROSS_QUESTION_REFERENCE",
          id: issue.id,
          message: `${issue.id} targets ${targetId} from another question`,
        });
      }
    }

    if (issue.regionIds.some((regionId) => !regionIds.has(regionId))) {
      errors.push({
        code: "UNKNOWN_REFERENCE",
        id: issue.id,
        message: `${issue.id} references an unknown region`,
      });
    }
  }

  return errors;
}
