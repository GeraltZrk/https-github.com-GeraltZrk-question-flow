import { describe, it, expect } from "vitest";
import {
  generateDemoEvidence,
  validateFieldTransform,
} from "@/domain/evidencePreflight";
import { EvidenceBundleSchema } from "@/domain/schema";

describe("generateDemoEvidence", () => {
  const evidence = generateDemoEvidence();

  it("passes EvidenceBundleSchema validation", () => {
    expect(EvidenceBundleSchema.safeParse(evidence).success).toBe(true);
  });

  it("has exactly 5 images", () => {
    expect(evidence.images).toHaveLength(5);
  });

  it("has exactly 5 regions", () => {
    expect(evidence.regions).toHaveLength(5);
  });

  it("every region references a known image", () => {
    const imageIds = new Set(evidence.images.map((i) => i.id));
    for (const r of evidence.regions) {
      expect(imageIds.has(r.imageId)).toBe(true);
    }
  });

  it("every region has a non-empty rawText", () => {
    for (const r of evidence.regions) {
      expect(r.rawText.length).toBeGreaterThan(0);
    }
  });

  it("region IDs are unique", () => {
    const ids = evidence.regions.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every image has required SourceImage fields", () => {
    for (const img of evidence.images) {
      expect(img.id).toBeTruthy();
      expect(img.fileName).toBeTruthy();
      expect(img.sha256).toHaveLength(64);
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
    }
  });

  it("every cropHash is a valid 64-char hex", () => {
    const hex64 = /^[a-f0-9]{64}$/i;
    for (const r of evidence.regions) {
      expect(hex64.test(r.cropHash)).toBe(true);
    }
  });
});

describe("validateFieldTransform", () => {
  it("PERCENT_TO_RATIO: extracts 0.08 from 'discount rate is 8%'", () => {
    expect(
      validateFieldTransform("discount rate is 8%", "PERCENT_TO_RATIO", 0.08),
    ).toBe(true);
  });

  it("PERCENT_TO_RATIO: returns false for wrong expected value", () => {
    expect(
      validateFieldTransform("discount rate is 8%", "PERCENT_TO_RATIO", 0.06),
    ).toBe(false);
  });

  it("INITIAL_COST_TO_NEGATIVE: extracts -1000 from 'costs $1,000 today'", () => {
    expect(
      validateFieldTransform(
        "costs $1,000 today",
        "INITIAL_COST_TO_NEGATIVE",
        -1000,
      ),
    ).toBe(true);
  });

  it("NONE (default): extracts 400 from '$400 in year 1'", () => {
    expect(validateFieldTransform("$400 in year 1", undefined, 400)).toBe(
      true,
    );
  });

  it("NONE: returns false when no number in rawText", () => {
    expect(
      validateFieldTransform("no numbers here", "NONE", 123),
    ).toBe(false);
  });

  it("returns false for unsupported transform rule", () => {
    expect(
      validateFieldTransform("8%", "INVALID_RULE", 0.08),
    ).toBe(false);
  });

  it("PERCENT_TO_RATIO: extracts 0.06 from 'discount 6%'", () => {
    expect(
      validateFieldTransform("discount 6%", "PERCENT_TO_RATIO", 0.06),
    ).toBe(true);
  });

  it("INITIAL_COST_TO_NEGATIVE: returns false when cost pattern absent", () => {
    expect(
      validateFieldTransform("$400 in year 1", "INITIAL_COST_TO_NEGATIVE", -400),
    ).toBe(false);
  });
});
