import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './domain/entities/instrument.entity';
import { MarketData } from './domain/entities/market-data.entity';
import { Order } from './domain/entities/order.entity';
import { User } from './domain/entities/user.entity';
import { CancelOrderController } from './application/features/cancel-order/cancel-order.controller';
import { CancelOrderFeature } from './application/features/cancel-order/cancel-order.feature';
import { CreateOrderController } from './application/features/create-order/create-order.controller';
import { CreateOrderFeature } from './application/features/create-order/create-order.feature';
import { GetInstrumentByIdService } from './application/services/get-instrument-by-id.service';
import { GetOrderByIdempotencyKeyService } from './application/services/get-order-by-idempotency-key.service';
import { LockUserService } from './application/services/lock-user.service';
import { ScreenOrderService } from './application/services/screen-order.service';
import { GetInstrumentsController } from './application/features/get-instruments/get-instruments.controller';
import { GetInstrumentsFeature } from './application/features/get-instruments/get-instruments.feature';
import { GetPortfolioController } from './application/features/get-portfolio/get-portfolio.controller';
import { GetPortfolioFeature } from './application/features/get-portfolio/get-portfolio.feature';
import { GetLatestMarketDataService } from './application/services/get-latest-market-data.service';
import { GetPortfolioTotalsService } from './application/services/get-portfolio-totals.service';
import { SearchInstrumentsService } from './application/services/search-instruments.service';
import { GetUserByIdService } from './application/services/get-user-by-id.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Instrument, MarketData, Order])],
  controllers: [
    GetPortfolioController,
    GetInstrumentsController,
    CreateOrderController,
    CancelOrderController,
  ],
  providers: [
    GetPortfolioFeature,
    GetUserByIdService,
    GetPortfolioTotalsService,
    GetLatestMarketDataService,
    GetInstrumentsFeature,
    SearchInstrumentsService,
    CreateOrderFeature,
    CancelOrderFeature,
    LockUserService,
    GetOrderByIdempotencyKeyService,
    GetInstrumentByIdService,
    ScreenOrderService,
  ],
})
export class MarketModule {}
