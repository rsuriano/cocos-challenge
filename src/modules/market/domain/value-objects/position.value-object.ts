import Decimal from 'decimal.js';
import { MarketData } from '../entities/market-data.entity';
import { PortfolioTotals } from '../../types/portfolio.types';

export class Position {
  private constructor(
    readonly instrument: { id: number; ticker: string | null; name: string | null },
    readonly marketData: MarketData | null,
    readonly quantity: Decimal,
    readonly reservedQuantity: Decimal,
    private readonly averageCost: Decimal,
  ) {}

  // Weighted average cost over every FILLED buy: sells reduce the quantity but
  // don't change the average. It doesn't reset if the position is fully closed
  // and reopened.
  static create(totals: PortfolioTotals): Position {
    const boughtQuantity = new Decimal(totals.boughtQuantity);
    const quantity = boughtQuantity.minus(totals.soldQuantity);
    const averageCost = boughtQuantity.isZero()
      ? new Decimal(0)
      : new Decimal(totals.boughtCost).div(boughtQuantity);

    return new Position(
      { id: totals.instrumentId, ticker: totals.ticker, name: totals.name },
      null,
      quantity,
      new Decimal(totals.reservedQuantity),
      averageCost,
    );
  }

  priced(marketData: MarketData | null): Position {
    return new Position(
      this.instrument,
      marketData,
      this.quantity,
      this.reservedQuantity,
      this.averageCost,
    );
  }

  isOpen(): boolean {
    return this.quantity.gt(0);
  }

  // Shares already committed to NEW sell orders can't be sold again.
  availableQuantity(): Decimal {
    return this.quantity.minus(this.reservedQuantity);
  }

  marketValue(): Decimal | null {
    const close = this.marketData?.close;
    if (close === null || close === undefined) return null;

    return this.quantity.times(close);
  }

  cost(): Decimal {
    return this.quantity.times(this.averageCost);
  }

  // Percentages; null when there is no base to compare against.
  totalReturn(): Decimal | null {
    const cost = this.cost();
    const marketValue = this.marketValue();
    if (marketValue === null || cost.isZero()) return null;

    return marketValue.minus(cost).div(cost).times(100);
  }

  dailyReturn(): Decimal | null {
    if (!this.marketData) return null;

    const { close, previousClose } = this.marketData;
    if (close === null || previousClose === null || new Decimal(previousClose).isZero()) {
      return null;
    }

    return new Decimal(close).minus(previousClose).div(previousClose).times(100);
  }
}
