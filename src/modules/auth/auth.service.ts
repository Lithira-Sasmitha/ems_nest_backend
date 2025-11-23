import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
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

  // validate credentials (returns user without password)
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;

    const { password, ...safe } = user;
    return safe as User;
  }

  // generate access + refresh tokens (uses JwtModule config but allows per-token expiry)
  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Use configured module secret by default; cast expiresIn to any to satisfy types
    const accessToken = this.jwtService.sign(payload, {
      // no secret here to rely on JwtModule config OR include secret if needed:
      // secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  // store hashed refresh token
  async storeRefreshToken(userId: string, token: string) {
    const hash = await bcrypt.hash(token, 10);
    await this.usersService.update(userId, { refreshToken: hash });
  }

  // login: returns both tokens and stores hashed refresh token
  async login(user: User) {
    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  // refresh: validate refresh token (bcrypt compare with hashed stored token), rotate tokens
  async refreshToken(userId: string, token: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) throw new ForbiddenException('Access denied');

    const ok = await bcrypt.compare(token, user.refreshToken);
    if (!ok) throw new ForbiddenException('Invalid refresh token');

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  // logout: remove refresh token
  async logout(userId: string) {
    await this.usersService.update(userId, { refreshToken: null });
    return { message: 'Logged out' };
  }

  // register helper used by controller
  async register(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    nic?: string;
    role?: UserRole;
  }) {
    const exist = await this.usersService.findByEmail(data.email);
    if (exist) throw new UnauthorizedException('Email already exists');

    const user = await this.usersService.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      phoneNumber: data.phoneNumber,
      nic: data.nic,
      role: data.role ?? UserRole.USER,
    });

    const { password, ...rest } = user;
    return rest;
  }
}
