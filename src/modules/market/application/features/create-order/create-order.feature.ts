import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../domain/entities/order.entity';
import {
  OrderRequest,
  OrderRequestArgs,
} from '../../../domain/value-objects/order-request.value-object';
import { Portfolio } from '../../../domain/value-objects/portfolio.value-object';
import { GetInstrumentByIdService } from '../../services/get-instrument-by-id.service';
import { GetLatestMarketDataService } from '../../services/get-latest-market-data.service';
import { GetOrderByIdempotencyKeyService } from '../../services/get-order-by-idempotency-key.service';
import { GetPortfolioTotalsService } from '../../services/get-portfolio-totals.service';
import { LockUserService } from '../../services/lock-user.service';
import { ScreenOrderService } from '../../services/screen-order.service';

/**
 * Validates the request and resolves the instrument and price first; only the
 * balance-dependent part runs inside a transaction that locks the user's row:
 * - A retry with the same idempotency key returns the existing order.
 * - The order is always saved: REJECTED when screening fails, FILLED for
 *   MARKET (at the latest close), NEW for LIMIT.
 */
@Injectable()
export class CreateOrderFeature {
  constructor(
    private readonly dataSource: DataSource,
    private readonly getInstrumentByIdService: GetInstrumentByIdService,
    private readonly getLatestMarketDataService: GetLatestMarketDataService,
    private readonly lockUserService: LockUserService,
    private readonly getOrderByIdempotencyKeyService: GetOrderByIdempotencyKeyService,
    private readonly getPortfolioTotalsService: GetPortfolioTotalsService,
    private readonly screenOrderService: ScreenOrderService,
  ) {}

  async execute(args: OrderRequestArgs, idempotencyKey: string): Promise<Order> {
    const request = OrderRequest.create(args);

    const instrument = await this.getInstrumentByIdService.execute(request.instrumentId);
    if (!instrument) {
      throw new NotFoundException('Instrument not found');
    }
    if (!instrument.isTradable()) {
      throw new BadRequestException('Instrument is not tradable');
    }

    const [marketData] = await this.getLatestMarketDataService.execute([instrument.id]);
    const { size, price } = request.resolve(marketData?.close);

    return this.dataSource.transaction(async manager => {
      const user = await this.lockUserService.execute(manager, request.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existingOrder = await this.getOrderByIdempotencyKeyService.execute(
        manager,
        user.id,
        idempotencyKey,
      );
      if (existingOrder) {
        return existingOrder;
      }

      const totals = await this.getPortfolioTotalsService.execute(user.id, manager);
      const portfolio = Portfolio.create(totals);

      const order = new Order().create({
        userId: user.id,
        instrumentId: instrument.id,
        side: request.side,
        type: request.type,
        size,
        price,
        idempotencyKey,
      });

      const screening = this.screenOrderService.execute(order, portfolio);
      if (!screening.success) {
        order.reject(screening.rejectionReason);
      } else if (order.isMarket()) {
        order.fill();
      }

      return manager.save(order);
    });
  }
}
