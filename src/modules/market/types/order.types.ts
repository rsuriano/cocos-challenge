export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export enum OrderStatus {
  NEW = 'NEW',
  FILLED = 'FILLED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum OrderRejectionReason {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_SHARES = 'INSUFFICIENT_SHARES',
  NO_MARKET_PRICE = 'NO_MARKET_PRICE',
  AMOUNT_BELOW_PRICE = 'AMOUNT_BELOW_PRICE',
}
