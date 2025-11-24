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

  // -----------------------------
  // CREATE NEW USER
  // -----------------------------
  async create(data: {
    name: string;
    phoneNumber?: string;
    nic?: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const hashed = await bcrypt.hash(data.password, 10);//enuun --------------------------

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

  // -----------------------------
  // FIND USER BY EMAIL
  // -----------------------------
  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  // -----------------------------
  // FIND USER BY ID
  // -----------------------------
  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  // -----------------------------
  // UPDATE ANY USER FIELD (used for refreshToken)
  // -----------------------------
  async update(id: string, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  // -----------------------------
  // CHANGE USER ROLE
  // -----------------------------
  async setRole(id: string, role: UserRole) {
    await this.repo.update(id, { role });
    return this.findById(id);
  }

  // -----------------------------
  // GET ALL USERS (NO PASSWORD / NO REFRESH TOKEN)
  // -----------------------------
  async getAllUsers() {
    return this.repo.find({
      select: [
        'id',
        'name',
        'email',
        'phoneNumber',
        'nic',
        'role',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // -----------------------------
  // PAGINATED USERS LIST
  // -----------------------------
  async getUsersPaginated(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'name',
        'email',
        'phoneNumber',
        'nic',
        'role',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      total,
      page,
      limit,
      data: users,
    };
  }

  // -----------------------------
  // AUTO-CREATE SUPER ADMIN
  // -----------------------------
  async ensureSuperAdmin() {
    const exists = await this.repo.findOne({
      where: { role: UserRole.SUPERADMIN },
    });

    if (exists) return;
//seeder -----------------------
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
/// logger-------------------
    console.log(
      `🔥 SUPER ADMIN AUTO-CREATED → email: ${defaultEmail} | password: ${defaultPass}`,
    );
  }
}
