import { Body, Controller, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { IdempotencyKey } from '../../../../../infrastructure/decorators/idempotency-key.decorator';
import type { OrderRequestArgs } from '../../../domain/value-objects/order-request.value-object';
import { CreateOrderFeature } from './create-order.feature';
import { OrderDTO } from '../types/order.dto';

@Controller()
@ApiTags('Orders')
export class CreateOrderController {
  constructor(private readonly feature: CreateOrderFeature) {}

  @Post('orders')
  // Unlike @Query or @Param, Swagger can't infer headers read by a custom decorator
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID' })
  async handle(
    @IdempotencyKey() idempotencyKey: string,
    @Body() body: OrderRequestArgs,
  ): Promise<OrderDTO> {
    const order = await this.feature.execute(body, idempotencyKey);
    return OrderDTO.create(order);
  }
}
