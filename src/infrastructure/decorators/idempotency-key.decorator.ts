import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const IdempotencyKey = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const key = ctx.switchToHttp().getRequest<Request>().header('Idempotency-Key');
  if (!key || !UUID_REGEX.test(key)) {
    throw new BadRequestException('Idempotency-Key header must be a UUID');
  }

  return key;
});
