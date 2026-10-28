import { MarketData } from '../entities/market-data.entity';
import { PortfolioTotals } from '../../types/portfolio.types';
import { Portfolio } from './portfolio.value-object';

describe('Portfolio', () => {
  const row = (overrides: Partial<PortfolioTotals>): PortfolioTotals => ({
    instrumentId: 1,
    ticker: null,
    name: null,
    boughtQuantity: '0',
    boughtCost: '0',
    soldQuantity: '0',
    reservedQuantity: '0',
    cashBalance: '0',
    reservedCash: '0',
    ...overrides,
  });
  const price = (instrumentId: number, close: string) =>
    Object.assign(new MarketData(), { instrumentId, close, previousClose: close });

  it('adds up cash across instruments and keeps only open positions', () => {
    const portfolio = Portfolio.create(
      [
        row({ instrumentId: 1, cashBalance: '1000' }),
        row({
          instrumentId: 2,
          boughtQuantity: '10',
          boughtCost: '1000',
          cashBalance: '-1000',
          reservedCash: '200',
        }),
        row({ instrumentId: 3, boughtQuantity: '5', boughtCost: '50', soldQuantity: '5' }),
      ],
      [price(2, '150')],
    );

    expect(portfolio.positions.map(p => p.instrument.id)).toEqual([2]);
    expect(portfolio.availableCash.toString()).toBe('-200');
    expect(portfolio.reservedCash.toString()).toBe('200');
    expect(portfolio.totalCash().toString()).toBe('0');
    expect(portfolio.totalValue().toString()).toBe('1500');
  });

  it('excludes positions without a price from the total', () => {
    const portfolio = Portfolio.create(
      [row({ instrumentId: 2, boughtQuantity: '10', boughtCost: '1000', cashBalance: '500' })],
      [],
    );

    expect(portfolio.positions).toHaveLength(1);
    expect(portfolio.totalValue().toString()).toBe('500');
  });
});
