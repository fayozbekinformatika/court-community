import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      console.warn(
        'DATABASE_URL is not configured. Database-backed routes will be unavailable until the env var is set.',
      );
      return;
    }

    try {
      await this.$connect();
      console.log('Connected to the database successfully.');
    } catch {
      console.warn(
        'Database connection unavailable at startup. The API will continue running in limited mode.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Disconnected from the database.');
  }
}
