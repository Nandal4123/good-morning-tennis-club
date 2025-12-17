import dotenv from "dotenv";
import { createPrismaClient } from "./create-prisma-client.js";
import { hashSecret } from "../src/utils/secretHash.js";

dotenv.config();

function parseArgs(argv) {
  const args = { force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--force") args.force = true;
  }
  return args;
}

function getEnvPair(prefix) {
  const joinCode = process.env[`${prefix}_JOIN_CODE`] || "";
  const adminPassword = process.env[`${prefix}_ADMIN_PASSWORD`] || "";
  return { joinCode, adminPassword };
}

async function main() {
  const { force } = parseArgs(process.argv.slice(2));
  const prisma = createPrismaClient();

  try {
    console.log("🔧 Seed club credentials 시작");
    console.log("옵션:", { force });
    console.log("\n필요 env:");
    console.log(" - DEFAULT_JOIN_CODE, DEFAULT_ADMIN_PASSWORD");
    console.log(" - ACE_JOIN_CODE, ACE_ADMIN_PASSWORD (선택)");

    const mappings = [
      { subdomain: "default", envPrefix: "DEFAULT" },
      { subdomain: "ace-club", envPrefix: "ACE" },
    ];

    for (const m of mappings) {
      const club = await prisma.club.findUnique({
        where: { subdomain: m.subdomain },
        select: {
          id: true,
          name: true,
          subdomain: true,
          joinCodeHash: true,
          adminPasswordHash: true,
        },
      });

      if (!club) {
        console.warn(`⚠️ 클럽 없음: ${m.subdomain}`);
        continue;
      }

      const { joinCode, adminPassword } = getEnvPair(m.envPrefix);

      const data = {};
      if ((force || !club.joinCodeHash) && joinCode) {
        data.joinCodeHash = hashSecret(joinCode);
      }
      if ((force || !club.adminPasswordHash) && adminPassword) {
        data.adminPasswordHash = hashSecret(adminPassword);
      }

      if (Object.keys(data).length === 0) {
        console.log(`ℹ️ 스킵: ${club.name} (${club.subdomain}) - 변경 없음(또는 env 미설정)`);
        continue;
      }

      await prisma.club.update({
        where: { id: club.id },
        data,
      });

      console.log(`✅ 설정 완료: ${club.name} (${club.subdomain})`);
    }

    console.log("\n🎉 Seed 완료");
    console.log("다음 단계:");
    console.log(" - server 재시작");
    console.log(" - Owner 로그인 후 /owner 에서 클럽 운영 기능 사용");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Seed 실패:", e);
  process.exit(1);
});


