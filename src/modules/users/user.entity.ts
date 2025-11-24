import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  CLIENT = 'CLIENT',
  SUPERADMIN = 'SUPERADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  nic?: string;

  @Column()
  email: string;

  @Column()
  password: string;

@Column({ type: 'text', nullable: true })
refreshToken: string | null;


  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
