import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from '../../domain/entities/instrument.entity';

const SEARCH_LIMIT = 10;
// pg_trgm's default (0.6) misses typos like "galisia" -> "Galicia"
const SIMILARITY_THRESHOLD = 0.4;

@Injectable()
export class SearchInstrumentsService {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepository: Repository<Instrument>,
  ) {}

  /**
   * Prefix match covers 1-2 letter searches, where trigrams don't work.
   */
  async execute(search: string): Promise<Instrument[]> {
    return this.instrumentRepository
      .createQueryBuilder('i')
      .where('i.ticker ILIKE :prefix', { prefix: `${search}%` })
      .orWhere(
        'GREATEST(word_similarity(:search, i.ticker), word_similarity(:search, i.name)) >= :threshold',
      )
      .orderBy(
        'CASE WHEN UPPER(i.ticker) = UPPER(:search) THEN 0 WHEN i.ticker ILIKE :prefix THEN 1 ELSE 2 END',
      )
      .addOrderBy(
        'GREATEST(word_similarity(:search, i.ticker), word_similarity(:search, i.name))',
        'DESC',
      )
      .setParameters({ search, prefix: `${search}%`, threshold: SIMILARITY_THRESHOLD })
      .limit(SEARCH_LIMIT)
      .getMany();
  }
}
