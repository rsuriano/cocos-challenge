import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'users_pkey' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'accountnumber', type: 'varchar', length: 20, nullable: true })
  accountNumber: string | null;
}
