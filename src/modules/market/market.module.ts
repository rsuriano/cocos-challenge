import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './domain/entities/instrument.entity';
import { MarketData } from './domain/entities/market-data.entity';
import { Order } from './domain/entities/order.entity';
import { User } from './domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Instrument, MarketData, Order])],
  controllers: [],
  providers: [],
})
export class MarketModule {}
