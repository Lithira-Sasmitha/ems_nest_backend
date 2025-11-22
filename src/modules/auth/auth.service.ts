import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    if (user.role !== UserRole.SUPERADMIN) {
      throw new UnauthorizedException('Only SUPER ADMIN can log in');
    }

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;

    const { password, ...safeUser } = user;
    return safeUser as User;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    nic?: string;
    role?: UserRole;
  }) {
    const exist = await this.usersService.findByEmail(data.email);
    if (exist) throw new UnauthorizedException('Email already in use');

    const user = await this.usersService.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber,
      nic: data.nic,
      role: data.role ?? UserRole.USER,
    });

    const { password, ...rest } = user;
    return rest;
  }
}
