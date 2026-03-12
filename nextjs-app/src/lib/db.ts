/**
 * Database connection and utilities
 * Prisma Client with logging and performance monitoring
 */

import { PrismaClient } from '@prisma/client';
import { env } from '@/env';
import { logger, logPerformance } from './logger';

// PrismaClient singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'minimal',
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Performance monitoring middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  // Log slow queries (>100ms)
  if (duration > 100) {
    logPerformance({
      operation: `db.${params.model}.${params.action}`,
      duration,
      metadata: {
        model: params.model,
        action: params.action,
      },
    });
  }

  return result;
});

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

/**
 * Graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}

/**
 * Transaction wrapper with error handling
 */
export async function executeTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(callback);
  } catch (error) {
    logger.error('Transaction failed', { error });
    throw error;
  }
}

/**
 * Batch operations helper
 */
export async function batchCreate<T>(
  model: any,
  data: T[],
  batchSize: number = 100
): Promise<void> {
  const batches = [];
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
}

/**
 * Soft delete helper
 */
export async function softDelete(
  model: any,
  id: string
): Promise<void> {
  await model.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function paginate<T>(
  model: any,
  params: PaginationParams,
  where?: any,
  orderBy?: any
): Promise<PaginatedResult<T>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Full-text search helper (SQLite FTS)
 */
export async function searchFullText(
  model: any,
  searchTerm: string,
  fields: string[]
): Promise<any[]> {
  const orConditions = fields.map((field) => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive',
    },
  }));

  return await model.findMany({
    where: {
      OR: orConditions,
    },
  });
}

/**
 * Count with filters
 */
export async function countWithFilters(
  model: any,
  filters: any
): Promise<number> {
  return await model.count({
    where: filters,
  });
}

/**
 * Exists check
 */
export async function exists(
  model: any,
  where: any
): Promise<boolean> {
  const count = await model.count({ where });
  return count > 0;
}

/**
 * Get or create
 */
export async function getOrCreate<T>(
  model: any,
  where: any,
  create: any
): Promise<T> {
  let record = await model.findFirst({ where });

  if (!record) {
    record = await model.create({ data: create });
  }

  return record;
}

/**
 * Bulk update
 */
export async function bulkUpdate(
  model: any,
  ids: string[],
  data: any
): Promise<number> {
  const result = await model.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data,
  });

  return result.count;
}

/**
 * Database statistics
 */
export async function getDatabaseStats(): Promise<any> {
  const [
    studentCount,
    propertyCount,
    leaseCount,
    bursaryCount,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.property.count(),
    prisma.lease.count(),
    prisma.studentBursary.count(),
  ]);

  return {
    students: studentCount,
    properties: propertyCount,
    leases: leaseCount,
    bursaries: bursaryCount,
  };
}

// Export Prisma types
export type { Prisma } from '@prisma/client';
export * from '@prisma/client';
export default prisma;
