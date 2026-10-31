import { Order } from '../../../domain/entities/order.entity';
import {
  OrderRejectionReason,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../../types/order.types';

export class OrderDTO {
  id: number;
  userId: number | null;
  instrumentId: number | null;
  side: OrderSide | null;
  type: OrderType | null;
  size: number | null;
  price: string | null;
  status: OrderStatus | null;
  rejectionReason: OrderRejectionReason | null;
  datetime: Date | null;

  static create(order: Order): OrderDTO {
    const dto = new OrderDTO();
    dto.id = order.id;
    dto.userId = order.userId;
    dto.instrumentId = order.instrumentId;
    dto.side = order.side;
    dto.type = order.type;
    dto.size = order.size;
    dto.price = order.price;
    dto.status = order.status;
    dto.rejectionReason = order.rejectionReason ?? null;
    dto.datetime = order.datetime;

    return dto;
  }
}
