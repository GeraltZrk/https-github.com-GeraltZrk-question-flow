import {
  EvidenceBundleSchema,
  type EvidenceBundle,
} from "@/domain/schema";

const sha = (char: string) => char.repeat(64);

/**
 * Generate the frozen demo EvidenceBundle.
 *
 * Returns the same 5-image / 5-region structure used by `fixtures/demo.ts`.
 * In production, this would run Tesseract.js to produce SourceRegion[] from
 * uploaded images; for the demo it returns immutable fixture data.
 */
export function generateDemoEvidence(): EvidenceBundle {
  return EvidenceBundleSchema.parse({
    batchHash: sha("a"),
    images: [
      { id: "img01", fileName: "IMG_01.png", sha256: sha("1"), width: 1000, height: 1000 },
      { id: "img02", fileName: "IMG_02.png", sha256: sha("2"), width: 1000, height: 1000 },
      { id: "img03", fileName: "IMG_03.png", sha256: sha("3"), width: 1000, height: 1000 },
      { id: "img04", fileName: "IMG_04.png", sha256: sha("4"), width: 1000, height: 1000 },
      { id: "img05", fileName: "IMG_05.png", sha256: sha("5"), width: 1000, height: 1000 },
    ],
    regions: [
      {
        id: "r01", imageId: "img01",
        bbox: { x: 100, y: 100, w: 700, h: 220 },
        rawText: "$450 in year 2 and $500 in year 3; discount rate is 8%",
        cropHash: sha("b"),
      },
      {
        id: "r02", imageId: "img02",
        bbox: { x: 80, y: 90, w: 780, h: 240 },
        rawText: "Question 14: use the data table on the next page",
        cropHash: sha("c"),
      },
      {
        id: "r03", imageId: "img03",
        bbox: { x: 120, y: 100, w: 650, h: 180 },
        rawText: "discount rate is 6%",
        cropHash: sha("d"),
      },
      {
        id: "r04", imageId: "img04",
        bbox: { x: 90, y: 80, w: 800, h: 260 },
        rawText: "Question 13 costs $1,000 today and pays $400 in year 1",
        cropHash: sha("e"),
      },
      {
        id: "r05", imageId: "img05",
        bbox: { x: 110, y: 120, w: 690, h: 160 },
        rawText: "all cash flows occur at year-end",
        cropHash: sha("f"),
      },
    ],
  });
}

/** Per-rule transform functions.  Each returns a number or null. */
const ALLOWED_TRANSFORMS: Record<string, (raw: string) => number | null> = {
  PERCENT_TO_RATIO(raw: string): number | null {
    const m = raw.match(/(\d+\.?\d*)\s*%/);
    return m ? parseFloat(m[1]) / 100 : null;
  },
  INITIAL_COST_TO_NEGATIVE(raw: string): number | null {
    const m = raw.match(/costs?\s*\$?(\d[\d,.]*)/i);
    return m ? -parseFloat(m[1].replace(/,/g, "")) : null;
  },
  NONE(raw: string): number | null {
    const m = raw.match(/\$?(\d[\d,.]*)/);
    return m ? parseFloat(m[1].replace(/,/g, "")) : null;
  },
};

/**
 * Verify that a field's normalized value can be derived from its source
 * region's `rawText` using the given transform rule.
 *
 * Returns `true` when the derived value matches the expected value within
 * floating-point tolerance; `false` otherwise.
 */
export function validateFieldTransform(
  rawText: string,
  transformRule: string | undefined,
  expectedValue: number,
): boolean {
  const rule = transformRule ?? "NONE";
  const fn = ALLOWED_TRANSFORMS[rule];
  if (!fn) return false;
  const derived = fn(rawText);
  if (derived === null) return false;
  return Math.abs(derived - expectedValue) < 1e-9;
}
