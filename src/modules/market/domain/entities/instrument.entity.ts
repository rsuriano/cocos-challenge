import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { InstrumentType } from '../../types/instrument.types';

@Entity('instruments')
// GIN trigram indexes need an operator class @Index can't express; created by migration
@Index('instruments_ticker_trgm_idx', { synchronize: false })
@Index('instruments_name_trgm_idx', { synchronize: false })
export class Instrument {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'instruments_pkey' })
  id: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ticker: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  type: InstrumentType | null;

  isTradable(): boolean {
    return this.type === InstrumentType.ACCIONES;
  }
}
