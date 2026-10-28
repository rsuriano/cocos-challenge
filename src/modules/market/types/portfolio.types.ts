// One row per instrument the user has orders on, from a single aggregate query.
export interface PortfolioTotals {
  instrumentId: number;
  ticker: string | null;
  name: string | null;
  boughtQuantity: string;
  boughtCost: string;
  soldQuantity: string;
  reservedQuantity: string;
  cashBalance: string;
  reservedCash: string;
}
