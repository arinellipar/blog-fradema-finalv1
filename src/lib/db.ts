// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Best practice: Use a singleton pattern for PrismaClient to prevent multiple instances/connections in development (due to hot-reloading) or production.
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
