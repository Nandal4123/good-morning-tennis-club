/**
 * 클럽 테이블 스키마 확인 스크립트
 * 
 * 데이터베이스의 clubs 테이블에 adminPasswordHash, joinCodeHash 컬럼이 있는지 확인
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function main() {
  try {
    console.log("🔍 클럽 테이블 스키마 확인 중...\n");

    // Prisma를 통해 테이블 정보 확인
    const clubs = await prisma.club.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        subdomain: true,
        adminPasswordHash: true,
        joinCodeHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (clubs.length === 0) {
      console.log("⚠️ 클럽이 없습니다. 테이블 구조만 확인합니다.");
    } else {
      const club = clubs[0];
      console.log("✅ 클럽 샘플 데이터:");
      console.log(`  - ID: ${club.id}`);
      console.log(`  - 이름: ${club.name}`);
      console.log(`  - 서브도메인: ${club.subdomain}`);
      console.log(`  - adminPasswordHash: ${club.adminPasswordHash ? "✅ 존재" : "❌ NULL"}`);
      console.log(`  - joinCodeHash: ${club.joinCodeHash ? "✅ 존재" : "❌ NULL"}`);
      console.log(`  - createdAt: ${club.createdAt}`);
      console.log(`  - updatedAt: ${club.updatedAt}`);
    }

    // 직접 SQL로 컬럼 존재 여부 확인
    console.log("\n📊 직접 SQL 쿼리로 컬럼 확인:");
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clubs'
      AND column_name IN ('adminPasswordHash', 'joinCodeHash')
      ORDER BY column_name;
    `;

    if (Array.isArray(result) && result.length > 0) {
      console.log("✅ 컬럼이 데이터베이스에 존재합니다:");
      result.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log("❌ 컬럼이 데이터베이스에 없습니다!");
      console.log("   prisma db push를 다시 실행하거나 수동으로 컬럼을 추가해야 합니다.");
    }

    // 전체 컬럼 목록 확인
    console.log("\n📋 clubs 테이블의 모든 컬럼:");
    const allColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clubs'
      ORDER BY ordinal_position;
    `;

    allColumns.forEach((col) => {
      const marker = ['adminPasswordHash', 'joinCodeHash'].includes(col.column_name) ? ' ⭐' : '';
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})${marker}`);
    });

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    if (error.message.includes("adminPasswordHash") || error.message.includes("joinCodeHash")) {
      console.error("\n⚠️ Prisma가 컬럼을 찾지 못했습니다.");
      console.error("   데이터베이스에 컬럼이 실제로 없는 것 같습니다.");
      console.error("   다음 명령을 실행하세요:");
      console.error("   pnpm prisma db push --force-reset  # 주의: 데이터 손실 가능");
      console.error("   또는 수동으로 SQL 실행:");
      console.error("   ALTER TABLE clubs ADD COLUMN \"adminPasswordHash\" TEXT;");
      console.error("   ALTER TABLE clubs ADD COLUMN \"joinCodeHash\" TEXT;");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();


