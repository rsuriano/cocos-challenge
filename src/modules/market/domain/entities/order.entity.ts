import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Instrument } from './instrument.entity';
import { OrderSide, OrderStatus, OrderType } from '../../types/order.types';
import { User } from './user.entity';

@Entity('orders')
@Index('orders_userid_instrumentid_idx', ['userId', 'instrumentId'])
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
}
