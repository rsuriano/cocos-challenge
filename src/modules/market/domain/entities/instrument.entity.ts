import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { InstrumentType } from '../../types/instrument.types';

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ticker: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  type: InstrumentType | null;
}
