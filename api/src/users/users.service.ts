// api/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(currentUserId: string) {
    // Find all users *except* the currently logged-in user
    return this.prisma.user.findMany({
      where: {
        id: {
          not: currentUserId, // Exclude self
        },
      },
      select: {
        id: true,
        userName: true,
        profileImage: true,
        status: true,
      },
    });
  }
}