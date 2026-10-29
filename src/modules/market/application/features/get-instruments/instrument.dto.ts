import { Instrument } from '../../../domain/entities/instrument.entity';
import { InstrumentType } from '../../../types/instrument.types';

export class InstrumentDTO {
  id: number;
  ticker: string | null;
  name: string | null;
  type: InstrumentType | null;

  static create(instrument: Instrument): InstrumentDTO {
    const dto = new InstrumentDTO();
    dto.id = instrument.id;
    dto.ticker = instrument.ticker;
    dto.name = instrument.name;
    dto.type = instrument.type;

    return dto;
  }
}
