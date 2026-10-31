import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class GetOrderByIdempotencyKeyService {
  async execute(manager: EntityManager, userId: number, idempotencyKey: string) {
    return manager.findOneBy(Order, { userId, idempotencyKey });
  }
}
