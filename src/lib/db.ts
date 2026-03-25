// ============================================
// CAPA 5: PERSISTENCIA
// Prisma Client + Redis
// ============================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// --------------------------------------------
// REDIS CLIENT
// --------------------------------------------
import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });
    
    redisClient.on("error", (err: unknown) => {
      console.error("Redis Client Error:", err);
    });
    
    await redisClient.connect();
  }
  
  return redisClient;
}

// --------------------------------------------
// CACHE HELPERS
// --------------------------------------------
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  const redis = await getRedisClient();
  await redis.setEx(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.del(key);
}

// --------------------------------------------
// PINECONE CLIENT
// --------------------------------------------
import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export async function getPineconeIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || "bh-saas-rag";
  
  return client.index(indexName);
}
