import Decimal from 'decimal.js';
import { Portfolio } from '../../../domain/value-objects/portfolio.value-object';
import { Position } from '../../../domain/value-objects/position.value-object';

const toMoney = (value: Decimal | null) => (value ? value.toFixed(2) : null);

export class AssetDTO {
  instrumentId: number;
  ticker: string | null;
  name: string | null;
  quantity: string;
  reservedQuantity: string;
  marketValue: string | null;
  totalReturn: string | null;
  dailyReturn: string | null;

  static create(position: Position): AssetDTO {
    const asset = new AssetDTO();
    asset.instrumentId = position.instrument.id;
    asset.ticker = position.instrument.ticker;
    asset.name = position.instrument.name;
    asset.quantity = position.quantity.toString();
    asset.reservedQuantity = position.reservedQuantity.toString();
    asset.marketValue = toMoney(position.marketValue());
    asset.totalReturn = toMoney(position.totalReturn());
    asset.dailyReturn = toMoney(position.dailyReturn());

    return asset;
  }
}

export class CashDTO {
  total: string;
  available: string;
  reserved: string;
}

export class PortfolioDTO {
  userId: number;
  totalValue: string;
  cash: CashDTO;
  assets: AssetDTO[];

  static create(userId: number, portfolio: Portfolio): PortfolioDTO {
    const dto = new PortfolioDTO();
    dto.userId = userId;
    dto.totalValue = portfolio.totalValue().toFixed(2);
    dto.cash = {
      total: portfolio.totalCash().toFixed(2),
      available: portfolio.availableCash.toFixed(2),
      reserved: portfolio.reservedCash.toFixed(2),
    };
    dto.assets = portfolio.positions.map(position => AssetDTO.create(position));

    return dto;
  }
}
