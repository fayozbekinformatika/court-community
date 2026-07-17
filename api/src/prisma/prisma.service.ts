import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Supabase/pg poolerlarda prepared statements muammosi chiqadi.
    // Prisma ichidagi PG driver prepared statements caching'ni o‘chiradi.
    super({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL?.includes('pgbouncer=true')
              ? process.env.DATABASE_URL
              : process.env.DATABASE_URL
                ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}pgbouncer=true`
                : undefined,
        },
      },
    } as any);
  }

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
