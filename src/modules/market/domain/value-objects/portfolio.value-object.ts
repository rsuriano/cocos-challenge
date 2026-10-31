import Decimal from 'decimal.js';
import { MarketData } from '../entities/market-data.entity';
import { PortfolioTotals } from '../../types/portfolio.types';
import { Position } from './position.value-object';

export class Portfolio {
  private constructor(
    readonly positions: Position[],
    readonly availableCash: Decimal,
    readonly reservedCash: Decimal,
  ) {}

  // Balances only; call priced() to value the positions.
  static create(totals: PortfolioTotals[]): Portfolio {
    const positions = totals.map(row => Position.create(row)).filter(position => position.isOpen());

    const cashBalance = totals.reduce((sum, row) => sum.plus(row.cashBalance), new Decimal(0));
    const reservedCash = totals.reduce((sum, row) => sum.plus(row.reservedCash), new Decimal(0));

    return new Portfolio(positions, cashBalance.minus(reservedCash), reservedCash);
  }

  priced(latestMarketData: MarketData[]): Portfolio {
    const marketDataByInstrument = new Map(latestMarketData.map(md => [md.instrumentId, md]));

    return new Portfolio(
      this.positions.map(p => p.priced(marketDataByInstrument.get(p.instrument.id) ?? null)),
      this.availableCash,
      this.reservedCash,
    );
  }

  availableQuantity(instrumentId: number): Decimal {
    const position = this.positions.find(p => p.instrument.id === instrumentId);
    return position ? position.availableQuantity() : new Decimal(0);
  }

  totalCash(): Decimal {
    return this.availableCash.plus(this.reservedCash);
  }

  // Assets without a price don't add to the total.
  assetsValue(): Decimal {
    return this.positions.reduce(
      (total, position) => total.plus(position.marketValue() ?? 0),
      new Decimal(0),
    );
  }

  totalValue(): Decimal {
    return this.totalCash().plus(this.assetsValue());
  }
}
