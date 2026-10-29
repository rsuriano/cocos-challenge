import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './domain/entities/instrument.entity';
import { MarketData } from './domain/entities/market-data.entity';
import { Order } from './domain/entities/order.entity';
import { User } from './domain/entities/user.entity';
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
  controllers: [GetPortfolioController, GetInstrumentsController],
  providers: [
    GetPortfolioFeature,
    GetUserByIdService,
    GetPortfolioTotalsService,
    GetLatestMarketDataService,
    GetInstrumentsFeature,
    SearchInstrumentsService,
  ],
})
export class MarketModule {}
