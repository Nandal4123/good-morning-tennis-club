/**
 * Prisma Client 생성 유틸리티
 * 
 * 모든 스크립트에서 일관된 Prisma Client를 사용하도록 제공
 * connection_limit=1 설정으로 연결 풀 제한 문제 방지
 */

import { PrismaClient } from "@prisma/client";

/**
 * 최적화된 Prisma Client 생성
 * Supabase Transaction Mode 연결 풀 제한을 피하기 위해 connection_limit=1 설정
 */
export function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // DATABASE_URL에 connection_limit 파라미터가 없으면 추가
  let optimizedUrl = databaseUrl;
  
  if (!databaseUrl.includes("connection_limit")) {
    const separator = databaseUrl.includes("?") ? "&" : "?";
    optimizedUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1`;
    
    // 환경 변수 업데이트
    process.env.DATABASE_URL = optimizedUrl;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: optimizedUrl,
      },
    },
  });
}

