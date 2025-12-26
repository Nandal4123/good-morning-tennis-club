import dotenv from "dotenv";
import { createPrismaClient } from "./create-prisma-client.js";
import { hashSecret } from "../src/utils/secretHash.js";

dotenv.config();

// 클라이언트 코드에서 사용하는 비밀번호
const PASSWORDS = {
  default: "admin0405",
  "ace-club": "admin7171",
};

async function main() {
  const prisma = createPrismaClient();

  try {
    console.log("🔧 관리자 비밀번호 재설정 시작\n");

    for (const [subdomain, password] of Object.entries(PASSWORDS)) {
      const club = await prisma.club.findUnique({
        where: { subdomain },
        select: { id: true, name: true, subdomain: true },
      });

      if (!club) {
        console.warn(`⚠️ 클럽 없음: ${subdomain}`);
        continue;
      }

      const adminPasswordHash = hashSecret(password);

      await prisma.club.update({
        where: { id: club.id },
        data: { adminPasswordHash },
      });

      console.log(`✅ ${club.name} (${subdomain}): 비밀번호 재설정 완료`);
    }

    console.log("\n🎉 모든 클럽의 관리자 비밀번호 재설정 완료");
  } catch (error) {
    console.error("❌ 실패:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();




