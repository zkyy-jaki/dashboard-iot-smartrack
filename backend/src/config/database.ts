/**
 * Prisma client singleton — prevents multiple connections during hot-reloads in development.
 */
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  // Prevent multiple Prisma clients during ts-node-dev hot reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      config.server.nodeEnv === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (config.server.nodeEnv === 'development') {
  globalThis.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log('[Prisma] Database connected successfully.');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('[Prisma] Database disconnected.');
}
