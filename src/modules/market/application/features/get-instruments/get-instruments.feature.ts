import { Injectable } from '@nestjs/common';
import { SearchInstrumentsService } from '../../services/search-instruments.service';
import { InstrumentDTO } from './instrument.dto';

@Injectable()
export class GetInstrumentsFeature {
  constructor(private readonly searchInstrumentsService: SearchInstrumentsService) {}

  async execute(search: string): Promise<InstrumentDTO[]> {
    const instruments = await this.searchInstrumentsService.execute(search);

    return instruments.map(instrument => InstrumentDTO.create(instrument));
  }
}
