import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from '../../domain/entities/instrument.entity';

@Injectable()
export class GetInstrumentByIdService {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepository: Repository<Instrument>,
  ) {}

  async execute(id: number): Promise<Instrument | null> {
    return this.instrumentRepository.findOneBy({ id });
  }
}
