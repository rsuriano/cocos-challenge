import { ConflictException } from '@nestjs/common';
import { OrderSide, OrderStatus, OrderType } from '../../types/order.types';
import { Order } from './order.entity';

describe('Order', () => {
  const order = (status: OrderStatus) =>
    Object.assign(
      new Order().create({
        userId: 1,
        instrumentId: 2,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        size: 1,
        price: '100.00',
        idempotencyKey: 'key',
      }),
      { status },
    );

  it('cancels a NEW order', () => {
    const newOrder = order(OrderStatus.NEW);

    newOrder.cancel();

    expect(newOrder.status).toBe(OrderStatus.CANCELLED);
  });

  it('leaves a CANCELLED order as is', () => {
    const cancelled = order(OrderStatus.CANCELLED);

    expect(() => cancelled.cancel()).not.toThrow();
    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
  });

  it.each([OrderStatus.FILLED, OrderStatus.REJECTED])('refuses to cancel a %s order', status => {
    expect(() => order(status).cancel()).toThrow(ConflictException);
  });
});
