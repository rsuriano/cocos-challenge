import { Injectable, NotFoundException } from '@nestjs/common';
import { Portfolio } from '../../../domain/value-objects/portfolio.value-object';
import { GetLatestMarketDataService } from '../../services/get-latest-market-data.service';
import { GetPortfolioTotalsService } from '../../services/get-portfolio-totals.service';
import { GetUserByIdService } from '../../services/get-user-by-id.service';
import { PortfolioDTO } from './portfolio.dto';

@Injectable()
export class GetPortfolioFeature {
  constructor(
    private readonly getUserByIdService: GetUserByIdService,
    private readonly getPortfolioTotalsService: GetPortfolioTotalsService,
    private readonly getLatestMarketDataService: GetLatestMarketDataService,
  ) {}

  async execute(userId: number): Promise<PortfolioDTO> {
    const user = await this.getUserByIdService.execute(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totals = await this.getPortfolioTotalsService.execute(user.id);
    const latestMarketData = await this.getLatestMarketDataService.execute(
      totals.map(row => row.instrumentId),
    );

    const portfolio = Portfolio.create(totals).priced(latestMarketData);

    return PortfolioDTO.create(user.id, portfolio);
  }
}
