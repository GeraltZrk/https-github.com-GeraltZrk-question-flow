export type CashFlow = {
  period: number;
  value: number;
};

export type NpvInput = {
  initialInvestment: number;
  discountRate: number;
  cashFlows: CashFlow[];
  timing: "END_OF_PERIOD" | "BEGINNING_OF_PERIOD" | "UNRESOLVED";
};

export type NpvCompilation = {
  value: number;
  displayValue: string;
  excelFormula: string;
};

export class NpvGateError extends Error {
  constructor(
    public readonly code:
      | "INVALID_RATE"
      | "INVALID_PERIODS"
      | "UNSUPPORTED_TIMING",
  ) {
    super(code);
    this.name = "NpvGateError";
  }
}

export function compileNpvV1(input: NpvInput): NpvCompilation {
  if (input.timing !== "END_OF_PERIOD") {
    throw new NpvGateError("UNSUPPORTED_TIMING");
  }

  if (!Number.isFinite(input.discountRate) || input.discountRate <= -1) {
    throw new NpvGateError("INVALID_RATE");
  }

  const cashFlows = [...input.cashFlows].sort(
    (left, right) => left.period - right.period,
  );
  const periodsAreSequential =
    cashFlows.length > 0 &&
    cashFlows.every(
      (cashFlow, index) =>
        cashFlow.period === index + 1 && Number.isFinite(cashFlow.value),
    );

  if (!periodsAreSequential) {
    throw new NpvGateError("INVALID_PERIODS");
  }

  const value = cashFlows.reduce(
    (total, cashFlow) =>
      total +
      cashFlow.value / (1 + input.discountRate) ** cashFlow.period,
    input.initialInvestment,
  );
  const finalCashFlowRow = 3 + cashFlows.length;

  return {
    value,
    displayValue: value.toFixed(2),
    excelFormula: `=NPV(C2,C4:C${finalCashFlowRow})+C3`,
  };
}
