import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "./user.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users?page=1&limit=10  (SUPERADMIN ONLY)
  @Roles(UserRole.SUPERADMIN)
  @Get()
  async getUsers(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.usersService.getUsersPaginated(page, limit);
  }
}
