import { BadRequestException } from '@nestjs/common';
import { OrderRequest, OrderRequestArgs } from './order-request.value-object';

describe('OrderRequest', () => {
  const args = (overrides: Partial<OrderRequestArgs>): OrderRequestArgs => ({
    userId: 1,
    instrumentId: 2,
    side: 'BUY',
    type: 'MARKET',
    size: 10,
    ...overrides,
  });

  it.each([
    ['an invalid side', { side: 'CASH_IN' }],
    ['an invalid type', { type: 'STOP' }],
    ['both size and amount', { amount: 100 }],
    ['neither size nor amount', { size: undefined }],
    ['a fractional size', { size: 1.5 }],
    ['a size over the column limit', { size: 3_000_000_000 }],
    ['a non numeric amount', { size: undefined, amount: 'abc' }],
    ['an infinite amount', { size: undefined, amount: 'Infinity' }],
    ['a LIMIT without price', { type: 'LIMIT' }],
    ['a price with more than 2 decimals', { type: 'LIMIT', price: '0.004' }],
    ['a price over the column limit', { type: 'LIMIT', price: '1e9' }],
    ['a MARKET with price', { price: 100 }],
  ])('rejects %s', (_, overrides) => {
    expect(() => OrderRequest.create(args(overrides))).toThrow(BadRequestException);
  });

  it('normalizes the limit price to 2 decimals', () => {
    const request = OrderRequest.create(args({ type: 'LIMIT', price: 1000.5 }));

    expect(request.resolve('900').price).toBe('1000.50');
  });

  it('resolves a size as given and a LIMIT price over the market price', () => {
    const request = OrderRequest.create(args({ type: 'LIMIT', price: '1000' }));

    expect(request.resolve('925.85')).toEqual({ size: 10, price: '1000.00' });
  });

  it('resolves an amount as the max whole number of shares at the market price', () => {
    const request = OrderRequest.create(args({ size: undefined, amount: '5000' }));

    expect(request.resolve('925.85')).toEqual({ size: 5, price: '925.85' });
    expect(request.resolve(undefined)).toEqual({ size: 0, price: null });
  });

  it('rejects an amount that buys more shares than the column holds', () => {
    const request = OrderRequest.create(args({ size: undefined, amount: '1e12' }));

    expect(() => request.resolve('0.01')).toThrow(BadRequestException);
  });
});
