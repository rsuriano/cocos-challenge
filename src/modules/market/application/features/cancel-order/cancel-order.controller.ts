import { Controller, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderDTO } from '../types/order.dto';
import { CancelOrderFeature } from './cancel-order.feature';

@Controller()
@ApiTags('Orders')
export class CancelOrderController {
  constructor(private readonly feature: CancelOrderFeature) {}

  @Post('orders/:id/cancel')
  @HttpCode(200)
  async handle(@Param('id', ParseIntPipe) id: number): Promise<OrderDTO> {
    const order = await this.feature.execute(id);
    return OrderDTO.create(order);
  }
}
