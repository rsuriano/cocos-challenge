import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';

// orders.size is an integer column.
export const MAX_SIZE = 2_147_483_647;

export class OrderQuantity {
  private constructor(private readonly value: { size: number } | { amount: Decimal }) {}

  static create(size?: number, amount?: Decimal): OrderQuantity {
    if (size !== undefined && amount === undefined) return new OrderQuantity({ size });
    if (amount !== undefined && size === undefined) return new OrderQuantity({ amount });

    throw new BadRequestException('Send either size or amount');
  }

  // Whole shares at the given price; an amount can't be sized without one.
  sharesAt(price: string | null): number {
    if ('size' in this.value) return this.value.size;
    if (price === null) return 0;

    const shares = this.value.amount.div(price).floor();
    if (shares.gt(MAX_SIZE)) {
      throw new BadRequestException('amount buys more shares than an order can hold');
    }

    return shares.toNumber();
  }
}
