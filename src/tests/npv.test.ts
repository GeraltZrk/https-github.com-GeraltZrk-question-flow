import { describe, expect, it } from "vitest";

import { compileNpvV1, NpvGateError } from "@/domain/npv";
import { buildNpvWorkbook } from "@/domain/workbook";

describe("NPV_V1", () => {
  it("matches the frozen Q13 golden result and formula", () => {
    const result = compileNpvV1({
      initialInvestment: -1000,
      discountRate: 0.08,
      timing: "END_OF_PERIOD",
      cashFlows: [
        { period: 1, value: 400 },
        { period: 2, value: 450 },
        { period: 3, value: 500 },
      ],
    });

    expect(result.value).toBeCloseTo(153.08896001625754, 12);
    expect(result.displayValue).toBe("153.09");
    expect(result.excelFormula).toBe("=NPV(C2,C4:C6)+C3");
  });

  it("rejects timing that NPV_V1 does not support", () => {
    expect(() =>
      compileNpvV1({
        initialInvestment: -1000,
        discountRate: 0.08,
        timing: "BEGINNING_OF_PERIOD",
        cashFlows: [{ period: 1, value: 400 }],
      }),
    ).toThrowError(new NpvGateError("UNSUPPORTED_TIMING"));
  });

  it("rejects missing or duplicate periods", () => {
    expect(() =>
      compileNpvV1({
        initialInvestment: -1000,
        discountRate: 0.08,
        timing: "END_OF_PERIOD",
        cashFlows: [
          { period: 1, value: 400 },
          { period: 3, value: 500 },
        ],
      }),
    ).toThrowError(new NpvGateError("INVALID_PERIODS"));
  });

  it("builds only the three frozen workbook sheets", () => {
    const npvInput = {
      initialInvestment: -1000,
      discountRate: 0.08,
      timing: "END_OF_PERIOD" as const,
      cashFlows: [
        { period: 1, value: 400 },
        { period: 2, value: 450 },
        { period: 3, value: 500 },
      ],
    };
    const compilation = compileNpvV1(npvInput);
    const workbook = buildNpvWorkbook({
      questionId: "q13",
      npvInput,
      compilation,
      indexRows: [
        { questionId: "q13", status: "CONFIRMED", exported: true },
        { questionId: "q14", status: "MISSING", exported: false },
      ],
      sourceIds: {
        discountRate: "r01",
        initialInvestment: "r04",
        cashFlows: ["r04", "r01", "r01"],
        timing: "r05",
      },
      sources: [],
    });

    expect(workbook.SheetNames).toEqual(["Index", "Q13_NPV", "Sources"]);
    expect(workbook.Sheets.Q13_NPV.C8.f).toBe("NPV(C2,C4:C6)+C3");
    expect(workbook.Sheets.Q13_NPV.C8.v).toBeCloseTo(
      153.08896001625754,
      12,
    );
  });
});
