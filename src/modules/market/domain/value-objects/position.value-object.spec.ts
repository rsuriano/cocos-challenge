import { MarketData } from '../entities/market-data.entity';
import { Position } from './position.value-object';

describe('Position', () => {
  const marketData = (close: string | null, previousClose: string | null) =>
    Object.assign(new MarketData(), { instrumentId: 1, close, previousClose });

  const totals = {
    instrumentId: 1,
    ticker: 'GGAL',
    name: 'Galicia',
    boughtQuantity: '20',
    boughtCost: '3000',
    soldQuantity: '5',
    reservedQuantity: '3',
    cashBalance: '0',
    reservedCash: '0',
  };

  it('values the position with the weighted average cost', () => {
    const position = Position.create(totals).priced(marketData('220', '200'));

    expect(position.quantity.toString()).toBe('15');
    expect(position.cost().toString()).toBe('2250');
    expect(position.marketValue()?.toString()).toBe('3300');
    expect(position.totalReturn()?.toFixed(2)).toBe('46.67');
    expect(position.dailyReturn()?.toFixed(2)).toBe('10.00');
  });

  it('is closed when everything bought was sold', () => {
    const position = Position.create({ ...totals, soldQuantity: '20' }).priced(
      marketData('220', '200'),
    );

    expect(position.isOpen()).toBe(false);
  });

  it('returns null returns when there is no base to compare against', () => {
    const position = Position.create({ ...totals, boughtCost: '0' }).priced(
      marketData('220', null),
    );

    expect(position.totalReturn()).toBeNull();
    expect(position.dailyReturn()).toBeNull();
  });
});
