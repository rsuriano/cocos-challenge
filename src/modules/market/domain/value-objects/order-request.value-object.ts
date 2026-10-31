import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { OrderSide, OrderType } from '../../types/order.types';
import { MAX_SIZE, OrderQuantity } from './order-quantity.value-object';

export type OrderRequestArgs = {
  userId: number;
  instrumentId: number;
  side: string;
  type: string;
  size?: number;
  amount?: string | number;
  price?: string | number;
};

// orders.price is numeric(10,2).
const MAX_PRICE = new Decimal('99999999.99');

const positiveDecimal = z.union([z.string(), z.number()]).transform((value, ctx) => {
  try {
    const decimal = new Decimal(value);
    if (decimal.isFinite() && decimal.gt(0)) return decimal;
  } catch {
    // not a number
  }
  ctx.addIssue({ code: 'custom', message: 'must be a positive number' });
  return z.NEVER;
});

const schema = z
  .object({
    userId: z.number().int().positive(),
    instrumentId: z.number().int().positive(),
    side: z.enum([OrderSide.BUY, OrderSide.SELL]),
    type: z.enum([OrderType.MARKET, OrderType.LIMIT]),
    size: z.number().int().positive().max(MAX_SIZE).optional(),
    amount: positiveDecimal.optional(),
    price: positiveDecimal
      .refine(price => price.decimalPlaces() <= 2 && price.lte(MAX_PRICE), {
        message: `must have up to 2 decimals and be at most ${MAX_PRICE}`,
      })
      .transform(price => price.toFixed(2))
      .optional(),
  })
  .refine(args => (args.type === OrderType.LIMIT) === (args.price !== undefined), {
    message: 'LIMIT orders need a price; MARKET orders execute at the market price',
    path: ['price'],
  });

export class OrderRequest {
  private constructor(
    readonly userId: number,
    readonly instrumentId: number,
    readonly side: OrderSide,
    readonly type: OrderType,
    private readonly quantity: OrderQuantity,
    private readonly limitPrice: string | null,
  ) {}

  static create(args: OrderRequestArgs): OrderRequest {
    const result = schema.safeParse(args);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map(issue => [...issue.path, issue.message].join(' ')),
      );
    }

    const { userId, instrumentId, side, type, size, amount, price } = result.data;

    return new OrderRequest(
      userId,
      instrumentId,
      side,
      type,
      OrderQuantity.create(size, amount),
      price ?? null,
    );
  }

  resolve(marketPrice?: string | null): { size: number; price: string | null } {
    const price = this.limitPrice ?? marketPrice ?? null;
    return { size: this.quantity.sharesAt(price), price };
  }
}
