export type VehicleFinancialSummaryInput = {
  id: string;
  purchasePrice?: unknown;
  purchasedAt?: Date | null;
  soldPrice?: unknown;
  soldAt?: Date | null;
  evaluation?: {
    evaluationExpenses: {
      amount: unknown;
    }[];
  } | null;
};

export function toNumber(value: unknown): number {
  const numberValue = value === null || value === undefined ? 0 : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateProfitMargin(
  grossProfit: number | null,
  totalInvestment: number,
): number | null {
  if (grossProfit === null || totalInvestment <= 0) {
    return null;
  }

  return Number(((grossProfit / totalInvestment) * 100).toFixed(2));
}

export function calculateVehicleFinancialSummary(
  vehicle: VehicleFinancialSummaryInput,
) {
  const purchasePrice = toNullableNumber(vehicle.purchasePrice);
  const soldPrice = toNullableNumber(vehicle.soldPrice);
  const totalExpenses = vehicle.evaluation
    ? vehicle.evaluation.evaluationExpenses.reduce(
        (sum, expense) => sum + toNumber(expense.amount),
        0,
      )
    : 0;
  const totalInvestment = toNumber(vehicle.purchasePrice) + totalExpenses;
  const grossProfit = soldPrice === null ? null : soldPrice - totalInvestment;

  return {
    vehicleId: vehicle.id,
    purchasePrice,
    purchasedAt: vehicle.purchasedAt ?? null,
    totalExpenses: roundMoney(totalExpenses),
    totalInvestment: roundMoney(totalInvestment),
    soldPrice,
    soldAt: vehicle.soldAt ?? null,
    grossProfit: grossProfit === null ? null : roundMoney(grossProfit),
    profitMarginPercent: calculateProfitMargin(grossProfit, totalInvestment),
    isSold: soldPrice !== null && vehicle.soldAt !== null,
  };
}
