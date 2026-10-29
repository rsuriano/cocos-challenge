import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetInstrumentsFeature } from './get-instruments.feature';
import { InstrumentDTO } from './instrument.dto';

@Controller()
@ApiTags('Instruments')
export class GetInstrumentsController {
  constructor(private readonly feature: GetInstrumentsFeature) {}

  @Get('instruments')
  // Fuzzy search by ticker and/or name
  async handle(@Query('search') search?: string): Promise<InstrumentDTO[]> {
    const term = search?.trim();
    if (!term) {
      throw new BadRequestException('search is required');
    }

    return this.feature.execute(term);
  }
}
