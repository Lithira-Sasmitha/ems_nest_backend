import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(data: {
    name: string;
    phoneNumber?: string;
    nic?: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.repo.create({
      name: data.name,
      phoneNumber: data.phoneNumber,
      nic: data.nic,
      email: data.email.toLowerCase(),
      password: hashed,
      role: data.role ?? UserRole.USER,
    });
    return this.repo.save(user);
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async setRole(id: string, role: UserRole) {
    await this.repo.update(id, { role });
    return this.findById(id);
  }


  async ensureSuperAdmin() {
    const exists = await this.repo.findOne({
      where: { role: UserRole.SUPERADMIN },
    });

    if (exists) return;

    const hashedPass = await bcrypt.hash('Admin@123', 10);

    const superAdmin = this.repo.create({
      name: 'System Super Admin',
      phoneNumber: '0000000000',
      nic: '000000000V',
      email: 'admin@system.com',
      password: hashedPass,
      role: UserRole.SUPERADMIN,
    });

    await this.repo.save(superAdmin);

    console.log(
      '🔥 SUPER ADMIN AUTO-CREATED → email: admin@system.com | password: Admin@123',
    );
  }
}
