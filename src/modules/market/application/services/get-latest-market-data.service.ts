import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MarketData } from '../../domain/entities/market-data.entity';

@Injectable()
export class GetLatestMarketDataService {
  constructor(
    @InjectRepository(MarketData)
    private readonly marketDataRepository: Repository<MarketData>,
  ) {}

  async execute(instrumentIds: number[], manager?: EntityManager): Promise<MarketData[]> {
    if (instrumentIds.length === 0) {
      return [];
    }

    const repository = manager?.getRepository(MarketData) ?? this.marketDataRepository;

    return repository
      .createQueryBuilder('md')
      .distinctOn(['md.instrumentid'])
      .where('md.instrumentid IN (:...instrumentIds)', { instrumentIds })
      .orderBy('md.instrumentid')
      .addOrderBy('md.date', 'DESC')
      .getMany();
  }
}
