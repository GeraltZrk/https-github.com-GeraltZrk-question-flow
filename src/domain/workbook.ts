import * as XLSX from "xlsx";

import type { NpvCompilation, NpvInput } from "./npv";

export type WorkbookIndexRow = {
  questionId: string;
  status: string;
  exported: boolean;
};

export type WorkbookSourceRow = {
  sourceId: string;
  fileName: string;
  bbox: string;
  rawText: string;
  transformRule?: string;
  resolutionId?: string;
};

export type BuildWorkbookInput = {
  questionId: string;
  npvInput: NpvInput;
  compilation: NpvCompilation;
  indexRows: WorkbookIndexRow[];
  sourceIds: {
    discountRate: string;
    initialInvestment: string;
    cashFlows: string[];
    timing: string;
  };
  sources: WorkbookSourceRow[];
};

export function buildNpvWorkbook(input: BuildWorkbookInput): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const indexSheet = XLSX.utils.json_to_sheet(
    input.indexRows.map((row) => ({
      "Question ID": row.questionId,
      Status: row.status,
      Exported: row.exported ? "YES" : "NO",
    })),
  );

  const npvRows: Array<Array<string | number>> = [
    ["Known Data", "Period", "Value", "Source ID"],
    [
      "Discount Rate",
      "",
      input.npvInput.discountRate,
      input.sourceIds.discountRate,
    ],
    [
      "Initial Investment",
      0,
      input.npvInput.initialInvestment,
      input.sourceIds.initialInvestment,
    ],
    ...input.npvInput.cashFlows.map((cashFlow, index) => [
      `Cash Flow Y${cashFlow.period}`,
      cashFlow.period,
      cashFlow.value,
      input.sourceIds.cashFlows[index] ?? "",
    ]),
    [],
    ["NPV", "", input.compilation.value, "NPV_V1"],
    ["Cash Flow Timing", "", input.npvInput.timing, input.sourceIds.timing],
  ];
  const npvSheet = XLSX.utils.aoa_to_sheet(npvRows);
  const npvRow = 5 + input.npvInput.cashFlows.length;
  npvSheet[`C${npvRow}`] = {
    t: "n",
    f: input.compilation.excelFormula.replace(/^=/, ""),
    v: input.compilation.value,
  };

  const sourcesSheet = XLSX.utils.json_to_sheet(
    input.sources.map((source) => ({
      "Source ID": source.sourceId,
      File: source.fileName,
      BBox: source.bbox,
      "Raw Text": source.rawText,
      Transform: source.transformRule ?? "",
      Resolution: source.resolutionId ?? "",
    })),
  );

  XLSX.utils.book_append_sheet(workbook, indexSheet, "Index");
  XLSX.utils.book_append_sheet(workbook, npvSheet, `${input.questionId.toUpperCase()}_NPV`);
  XLSX.utils.book_append_sheet(workbook, sourcesSheet, "Sources");

  return workbook;
}
