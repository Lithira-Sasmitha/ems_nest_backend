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

  // generic update helper used by auth service (store/remove refresh token, etc)
  async update(id: string, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  // ensure at least one super admin exists on startup
  async ensureSuperAdmin() {
    const exists = await this.repo.findOne({
      where: { role: UserRole.SUPERADMIN },
    });

    if (exists) return;

    const defaultEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@system.com';
    const defaultPass = process.env.SUPER_ADMIN_PASSWORD ?? 'Admin@123';
    const defaultName = process.env.SUPER_ADMIN_NAME ?? 'System Super Admin';
    const defaultPhone = process.env.SUPER_ADMIN_PHONE ?? '0000000000';
    const defaultNic = process.env.SUPER_ADMIN_NIC ?? '000000000V';

    const hashedPass = await bcrypt.hash(defaultPass, 10);

    const superAdmin = this.repo.create({
      name: defaultName,
      phoneNumber: defaultPhone,
      nic: defaultNic,
      email: defaultEmail.toLowerCase(),
      password: hashedPass,
      role: UserRole.SUPERADMIN,
    });

    await this.repo.save(superAdmin);

    console.log(
      `🔥 SUPER ADMIN AUTO-CREATED → email: ${defaultEmail} | password: ${defaultPass}`,
    );
  }
}
