import { ConflictException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Instrument } from './instrument.entity';
import { OrderRejectionReason, OrderSide, OrderStatus, OrderType } from '../../types/order.types';
import { User } from './user.entity';

@Entity('orders')
@Index('orders_userid_instrumentid_idx', ['userId', 'instrumentId'])
@Index('orders_userid_idempotencykey_key', ['userId', 'idempotencyKey'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'orders_pkey' })
  id: number;

  @Column({ name: 'instrumentid', type: 'integer', nullable: true })
  instrumentId: number | null;

  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentid' })
  instrument: Instrument;

  @Column({ name: 'userid', type: 'integer', nullable: true })
  userId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;

  @Column({ type: 'integer', nullable: true })
  size: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  price: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  type: OrderType | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  side: OrderSide | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: OrderStatus | null;

  @Column({ name: 'datetime', type: 'timestamp without time zone', nullable: true })
  datetime: Date | null;

  @Column({ name: 'idempotencykey', type: 'uuid', nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'rejectionreason', type: 'varchar', length: 30, nullable: true })
  rejectionReason: OrderRejectionReason | null;

  create(args: {
    userId: number;
    instrumentId: number;
    side: OrderSide;
    type: OrderType;
    size: number;
    price: string | null;
    idempotencyKey: string;
  }): Order {
    const order = new Order();
    order.userId = args.userId;
    order.instrumentId = args.instrumentId;
    order.side = args.side;
    order.type = args.type;
    order.size = args.size;
    order.price = args.price;
    order.status = OrderStatus.NEW;
    order.datetime = new Date();
    order.idempotencyKey = args.idempotencyKey;
    return order;
  }

  isBuy(): boolean {
    return this.side === OrderSide.BUY;
  }

  isSell(): boolean {
    return this.side === OrderSide.SELL;
  }

  isMarket(): boolean {
    return this.type === OrderType.MARKET;
  }

  isNew(): boolean {
    return this.status === OrderStatus.NEW;
  }

  isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  total(): Decimal {
    return new Decimal(this.price ?? 0).times(this.size ?? 0);
  }

  fill() {
    this.status = OrderStatus.FILLED;
  }

  reject(reason: OrderRejectionReason) {
    this.status = OrderStatus.REJECTED;
    this.rejectionReason = reason;
  }

  cancel() {
    if (this.isCancelled()) return;
    if (!this.isNew()) {
      throw new ConflictException(`A ${this.status} order can't be cancelled`);
    }
    this.status = OrderStatus.CANCELLED;
  }
}
