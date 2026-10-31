import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Instrument } from '../src/modules/market/domain/entities/instrument.entity';
import { MarketData } from '../src/modules/market/domain/entities/market-data.entity';
import { Order } from '../src/modules/market/domain/entities/order.entity';
import { User } from '../src/modules/market/domain/entities/user.entity';
import { InstrumentType } from '../src/modules/market/types/instrument.types';
import { OrderSide, OrderStatus, OrderType } from '../src/modules/market/types/order.types';

// Requires the local database: `npm run env:up`. Creates its own user,
// instruments and prices, and deletes them afterwards.
describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let user: User;
  let stock: Instrument;
  let cash: Instrument;

  const postOrder = (body: object, idempotencyKey: string = randomUUID()) =>
    request(app.getHttpServer())
      .post('/orders')
      .set('Idempotency-Key', idempotencyKey)
      .send({ userId: user.id, instrumentId: stock.id, ...body });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    user = await dataSource
      .getRepository(User)
      .save({ email: 'e2e@test.com', accountNumber: 'E2E' });
    [stock, cash] = await dataSource.getRepository(Instrument).save([
      { ticker: 'E2E', name: 'E2E Stock', type: InstrumentType.ACCIONES },
      { ticker: 'E2EARS', name: 'E2E Pesos', type: InstrumentType.MONEDA },
    ]);
    await dataSource.getRepository(MarketData).save({
      instrumentId: stock.id,
      close: '100.00',
      previousClose: '90.00',
      date: new Date('2023-07-14'),
    });
    // 10000 pesos deposited.
    await dataSource.getRepository(Order).save({
      userId: user.id,
      instrumentId: cash.id,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      status: OrderStatus.FILLED,
      size: 10000,
      price: '1.00',
      datetime: new Date(),
    });
  });

  afterAll(async () => {
    await dataSource.getRepository(Order).delete({ userId: user.id });
    await dataSource.getRepository(MarketData).delete({ instrumentId: stock.id });
    await dataSource.getRepository(Instrument).delete([stock.id, cash.id]);
    await dataSource.getRepository(User).delete(user.id);
    await app.close();
  });

  it('fills a MARKET buy at the latest close', async () => {
    const res = await postOrder({ side: 'BUY', type: 'MARKET', size: 10 }).expect(201);

    expect(res.body).toMatchObject({
      status: 'FILLED',
      price: '100.00',
      size: 10,
      rejectionReason: null,
    });
  });

  it('sizes a buy by amount', async () => {
    const res = await postOrder({ side: 'BUY', type: 'MARKET', amount: '550' }).expect(201);

    expect(res.body).toMatchObject({ status: 'FILLED', size: 5 });
  });

  it('leaves a LIMIT order as NEW', async () => {
    const res = await postOrder({ side: 'SELL', type: 'LIMIT', size: 5, price: '120' }).expect(201);

    expect(res.body).toMatchObject({ status: 'NEW', price: '120.00' });
  });

  it('rejects a sell over the available shares, counting the reserved ones', async () => {
    // 15 bought, 5 reserved by the LIMIT sell above.
    const res = await postOrder({ side: 'SELL', type: 'MARKET', size: 11 }).expect(201);

    expect(res.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_SHARES' });
  });

  it('rejects a buy over the available cash', async () => {
    const res = await postOrder({ side: 'BUY', type: 'MARKET', size: 1000 }).expect(201);

    expect(res.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'INSUFFICIENT_FUNDS' });
  });

  it('returns the same order on a retry with the same idempotency key', async () => {
    const key = randomUUID();
    const first = await postOrder({ side: 'BUY', type: 'MARKET', size: 1 }, key).expect(201);
    const retry = await postOrder({ side: 'BUY', type: 'MARKET', size: 1 }, key).expect(201);

    expect(retry.body).toEqual(first.body);
  });

  it('fills only one of two concurrent sells that together exceed the shares', async () => {
    // 16 bought, 5 reserved: 11 available.
    const responses = await Promise.all([
      postOrder({ side: 'SELL', type: 'MARKET', size: 8 }),
      postOrder({ side: 'SELL', type: 'MARKET', size: 8 }),
    ]);

    expect(responses.map(res => res.body.status).sort()).toEqual(['FILLED', 'REJECTED']);
  });

  it.each([
    ['a missing idempotency key', { side: 'BUY', type: 'MARKET', size: 1 }, null, 400],
    ['an invalid body', { side: 'CASH_IN', type: 'MARKET', size: 1 }, randomUUID(), 400],
    [
      'an unknown user',
      { userId: 999999, side: 'BUY', type: 'MARKET', size: 1 },
      randomUUID(),
      404,
    ],
  ])('responds %s with an error', async (_, body, key, status) => {
    const req = request(app.getHttpServer())
      .post('/orders')
      .send({ userId: user.id, instrumentId: stock.id, ...body });
    if (key) req.set('Idempotency-Key', key);

    await req.expect(status);
  });

  it('cancels a NEW order, releasing its reservation', async () => {
    // 9200 cash available at this point; reserve 9000 of it.
    const limit = await postOrder({ side: 'BUY', type: 'LIMIT', size: 90, price: '100' }).expect(
      201,
    );
    await postOrder({ side: 'BUY', type: 'MARKET', size: 5 })
      .expect(201)
      .expect(res => expect(res.body.rejectionReason).toBe('INSUFFICIENT_FUNDS'));

    const cancelled = await request(app.getHttpServer())
      .post(`/orders/${limit.body.id}/cancel`)
      .expect(200);
    expect(cancelled.body).toMatchObject({ id: limit.body.id, status: 'CANCELLED' });

    await postOrder({ side: 'BUY', type: 'MARKET', size: 5 })
      .expect(201)
      .expect(res => expect(res.body.status).toBe('FILLED'));
  });

  it('cancelling twice returns the same CANCELLED order', async () => {
    const limit = await postOrder({ side: 'BUY', type: 'LIMIT', size: 1, price: '50' }).expect(201);
    const url = `/orders/${limit.body.id}/cancel`;

    const first = await request(app.getHttpServer()).post(url).expect(200);
    const second = await request(app.getHttpServer()).post(url).expect(200);

    expect(second.body).toEqual(first.body);
  });

  it('refuses to cancel a FILLED order', async () => {
    const filled = await postOrder({ side: 'BUY', type: 'MARKET', size: 1 }).expect(201);

    await request(app.getHttpServer()).post(`/orders/${filled.body.id}/cancel`).expect(409);
  });

  it('responds 404 when cancelling an unknown order', async () => {
    await request(app.getHttpServer()).post('/orders/999999/cancel').expect(404);
  });

  it('rejects trading a currency', async () => {
    await postOrder({ instrumentId: cash.id, side: 'BUY', type: 'MARKET', size: 1 }).expect(400);
  });
});
