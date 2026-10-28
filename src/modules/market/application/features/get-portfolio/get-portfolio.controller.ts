import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPortfolioFeature } from './get-portfolio.feature';
import { PortfolioDTO } from './portfolio.dto';

@Controller()
@ApiTags('Portfolio')
export class GetPortfolioController {
  constructor(private readonly feature: GetPortfolioFeature) {}

  @Get('portfolio/:userId')
  async handle(@Param('userId', ParseIntPipe) userId: number): Promise<PortfolioDTO> {
    return this.feature.execute(userId);
  }
}
