import { Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { Portfolio } from '../../domain/value-objects/portfolio.value-object';
import { OrderRejectionReason } from '../../types/order.types';

type ScreeningResult =
  { success: true } | { success: false; rejectionReason: OrderRejectionReason };

@Injectable()
export class ScreenOrderService {
  execute(order: Order, portfolio: Portfolio): ScreeningResult {
    if (order.price === null) {
      return { success: false, rejectionReason: OrderRejectionReason.NO_MARKET_PRICE };
    }

    if (!order.size) {
      return { success: false, rejectionReason: OrderRejectionReason.AMOUNT_BELOW_PRICE };
    }

    if (order.isBuy() && order.total().gt(portfolio.availableCash)) {
      return { success: false, rejectionReason: OrderRejectionReason.INSUFFICIENT_FUNDS };
    }

    if (order.isSell() && portfolio.availableQuantity(order.instrumentId!).lt(order.size)) {
      return { success: false, rejectionReason: OrderRejectionReason.INSUFFICIENT_SHARES };
    }

    return { success: true };
  }
}
