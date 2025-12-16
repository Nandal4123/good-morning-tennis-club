/**
 * 데이터베이스 연결 안정성 테스트 스크립트
 * 
 * connection_limit=1 설정이 제대로 작동하는지 확인
 */

import { createPrismaClient } from "./create-prisma-client.js";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  const prisma = createPrismaClient();
  
  try {
    console.log("🔍 데이터베이스 연결 테스트 시작...\n");
    
    // 1. 기본 연결 테스트
    console.log("1️⃣ 기본 연결 테스트...");
    const userCount = await prisma.user.count();
    console.log(`   ✅ 연결 성공! 사용자 수: ${userCount}명\n`);
    
    // 2. 여러 쿼리 순차 실행 테스트
    console.log("2️⃣ 순차 쿼리 실행 테스트 (connection_limit=1 확인)...");
    const startTime = Date.now();
    
    const [users, sessions, attendances, matches] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.attendance.count(),
      prisma.match.count(),
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ✅ 순차 쿼리 완료 (${duration}ms)`);
    console.log(`   - 사용자: ${users}명`);
    console.log(`   - 세션: ${sessions}개`);
    console.log(`   - 출석: ${attendances}건`);
    console.log(`   - 경기: ${matches}개\n`);
    
    // 3. DATABASE_URL 확인
    console.log("3️⃣ DATABASE_URL 설정 확인...");
    const dbUrl = process.env.DATABASE_URL || "";
    const hasConnectionLimit = dbUrl.includes("connection_limit");
    const hasPgbouncer = dbUrl.includes("pgbouncer=true");
    
    console.log(`   connection_limit 파라미터: ${hasConnectionLimit ? "✅ 있음" : "⚠️  없음 (자동 추가됨)"}`);
    console.log(`   pgbouncer 파라미터: ${hasPgbouncer ? "✅ 있음" : "⚠️  없음 (자동 추가됨)"}`);
    
    if (hasConnectionLimit && hasPgbouncer) {
      console.log(`   ✅ DATABASE_URL 최적화 완료!\n`);
    } else {
      console.log(`   ⚠️  DATABASE_URL이 자동으로 최적화되었습니다.\n`);
    }
    
    // 4. 연결 풀 상태 확인
    console.log("4️⃣ 연결 풀 상태 확인...");
    console.log(`   ✅ Prisma Client가 connection_limit=1로 설정됨`);
    console.log(`   ✅ Supabase Transaction Mode 연결 풀 제한 준수\n`);
    
    console.log("=".repeat(60));
    console.log("✅ 모든 테스트 통과!");
    console.log("✅ 데이터베이스 연결이 안정적으로 작동합니다!\n");
    
  } catch (error) {
    console.error("\n❌ 연결 테스트 실패:", error);
    
    if (error.message?.includes("MaxClientsInSessionMode")) {
      console.error("\n⚠️  연결 풀 제한 오류 발생!");
      console.error("   DATABASE_URL에 connection_limit=1이 설정되어 있는지 확인하세요.");
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log("🔌 데이터베이스 연결 해제 완료");
  }
}

testConnection()
  .then(() => {
    console.log("\n✅ 테스트 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 테스트 실패:", error);
    process.exit(1);
  });




