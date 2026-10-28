import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { dateTransformer } from '../../../../infrastructure/db/postgres/transformers/date.transformer';
import { Instrument } from './instrument.entity';

@Entity('marketdata')
@Index('marketdata_instrumentid_date_idx', ['instrumentId', 'date'])
export class MarketData {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'marketdata_pkey' })
  id: number;

  @Column({ name: 'instrumentid', type: 'integer', nullable: true })
  instrumentId: number | null;

  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentid' })
  instrument: Instrument;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  high: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  low: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  open: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  close: string | null;

  @Column({ name: 'previousclose', type: 'numeric', precision: 10, scale: 2, nullable: true })
  previousClose: string | null;

  @Column({ type: 'date', nullable: true, transformer: dateTransformer })
  date: Date | null;
}
