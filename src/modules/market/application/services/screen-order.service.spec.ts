import { Order } from '../../domain/entities/order.entity';
import { Portfolio } from '../../domain/value-objects/portfolio.value-object';
import { OrderRejectionReason, OrderSide, OrderType } from '../../types/order.types';
import { PortfolioTotals } from '../../types/portfolio.types';
import { ScreenOrderService } from './screen-order.service';

describe('ScreenOrderService', () => {
  const service = new ScreenOrderService();

  // 1000 available cash and 10 shares of instrument 2, 3 of them reserved.
  const portfolio = Portfolio.create([
    {
      instrumentId: 2,
      ticker: null,
      name: null,
      boughtQuantity: '10',
      boughtCost: '1000',
      soldQuantity: '0',
      reservedQuantity: '3',
      cashBalance: '2000',
      reservedCash: '1000',
    } satisfies PortfolioTotals,
  ]);
  const order = (side: OrderSide, size: number, price: string | null) =>
    new Order().create({
      userId: 1,
      instrumentId: 2,
      side,
      type: OrderType.MARKET,
      size,
      price,
      idempotencyKey: 'key',
    });

  it.each([
    ['buy within available cash', order(OrderSide.BUY, 10, '100'), undefined],
    ['sell within available shares', order(OrderSide.SELL, 7, '100'), undefined],
    ['no price', order(OrderSide.BUY, 1, null), OrderRejectionReason.NO_MARKET_PRICE],
    ['zero size', order(OrderSide.BUY, 0, '100'), OrderRejectionReason.AMOUNT_BELOW_PRICE],
    [
      'buy over available cash',
      order(OrderSide.BUY, 11, '100'),
      OrderRejectionReason.INSUFFICIENT_FUNDS,
    ],
    [
      'sell over available shares',
      order(OrderSide.SELL, 8, '100'),
      OrderRejectionReason.INSUFFICIENT_SHARES,
    ],
  ])('%s', (_, testOrder, rejectionReason) => {
    const result = service.execute(testOrder, portfolio);

    expect(result.success).toBe(rejectionReason === undefined);
    if (!result.success) expect(result.rejectionReason).toBe(rejectionReason);
  });
});
