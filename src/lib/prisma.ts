import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaClientMtime: number | undefined;
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getGeneratedClientMtime(): number | undefined {
  try {
    const classPath = path.join(
      process.cwd(),
      "src/generated/prisma/internal/class.ts",
    );
    return fs.statSync(classPath).mtimeMs;
  } catch {
    return undefined;
  }
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return global.prisma ?? createPrismaClient();
  }

  const mtime = getGeneratedClientMtime();
  if (
    global.prisma &&
    mtime !== undefined &&
    global.prismaClientMtime !== undefined &&
    global.prismaClientMtime !== mtime
  ) {
    void global.prisma.$disconnect();
    global.prisma = undefined;
  }

  if (!global.prisma) {
    global.prisma = createPrismaClient();
    global.prismaClientMtime = mtime;
  }

  return global.prisma;
}

export const prisma = getPrismaClient();
