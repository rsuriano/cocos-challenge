import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Order } from '../../domain/entities/order.entity';
import { OrderSide, OrderStatus } from '../../types/order.types';
import { PortfolioTotals } from '../../types/portfolio.types';

/**
 * Positions and cash come from the same statement so they reflect the same
 * snapshot of the orders table.
 */
@Injectable()
export class GetPortfolioTotalsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async execute(userId: number, manager?: EntityManager): Promise<PortfolioTotals[]> {
    const repository = manager?.getRepository(Order) ?? this.orderRepository;

    return repository
      .createQueryBuilder('o')
      .innerJoin('o.instrument', 'i')
      .select('o.instrumentid', 'instrumentId')
      .addSelect('i.ticker', 'ticker')
      .addSelect('i.name', 'name')
      .addSelect(
        `COALESCE(SUM(o.size) FILTER (WHERE o.status = :filled AND o.side = :buy), 0)`,
        'boughtQuantity',
      )
      .addSelect(
        `COALESCE(SUM(o.size * o.price) FILTER (WHERE o.status = :filled AND o.side = :buy), 0)`,
        'boughtCost',
      )
      .addSelect(
        `COALESCE(SUM(o.size) FILTER (WHERE o.status = :filled AND o.side = :sell), 0)`,
        'soldQuantity',
      )
      .addSelect(
        `COALESCE(SUM(o.size) FILTER (WHERE o.status = :new AND o.side = :sell), 0)`,
        'reservedQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.side IN (:cashIn, :sell) THEN o.size * o.price ELSE -(o.size * o.price) END) FILTER (WHERE o.status = :filled), 0)`,
        'cashBalance',
      )
      .addSelect(
        `COALESCE(SUM(o.size * o.price) FILTER (WHERE o.status = :new AND o.side = :buy), 0)`,
        'reservedCash',
      )
      .where('o.userid = :userId', { userId })
      .andWhere('o.status IN (:filled, :new)')
      .groupBy('o.instrumentid')
      .addGroupBy('i.ticker')
      .addGroupBy('i.name')
      .setParameters({
        buy: OrderSide.BUY,
        sell: OrderSide.SELL,
        cashIn: OrderSide.CASH_IN,
        filled: OrderStatus.FILLED,
        new: OrderStatus.NEW,
      })
      .getRawMany<PortfolioTotals>();
  }
}
