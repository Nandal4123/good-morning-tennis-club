import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { dir: null, snapshotDir: null, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir") args.dir = argv[i + 1];
    if (a === "--snapshot") args.snapshotDir = argv[i + 1];
    if (a === "--yes") args.yes = true;
  }
  return args;
}

function resolveLatestSnapshotDir(projectRoot) {
  const snapshotsRoot = path.join(projectRoot, "snapshots");
  const pointerFile = path.join(snapshotsRoot, "snapshot-latest.txt");

  if (fs.existsSync(pointerFile)) {
    const snapshotDir = fs.readFileSync(pointerFile, "utf-8").trim();
    if (snapshotDir && fs.existsSync(snapshotDir)) return snapshotDir;
  }

  if (!fs.existsSync(snapshotsRoot)) {
    throw new Error(`Snapshots directory not found: ${snapshotsRoot}`);
  }

  const entries = fs
    .readdirSync(snapshotsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("snapshot-"))
    .map((e) => {
      const full = path.join(snapshotsRoot, e.name);
      const stat = fs.statSync(full);
      return { full, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (!entries[0]) throw new Error(`No snapshots found in: ${snapshotsRoot}`);
  return entries[0].full;
}

function main() {
  const { dir, snapshotDir, yes } = parseArgs(process.argv.slice(2));

  // scripts/ 기준으로 projectRoot(=club-attendance) 를 안정적으로 찾는다.
  const projectRoot = path.join(__dirname, "..", "..");

  const targetDir = dir
    ? path.isAbsolute(dir)
      ? dir
      : path.join(process.cwd(), dir)
    : path.join("/tmp", "club-attendance-restore");

  const resolvedSnapshotDir = snapshotDir
    ? path.isAbsolute(snapshotDir)
      ? snapshotDir
      : path.join(process.cwd(), snapshotDir)
    : resolveLatestSnapshotDir(projectRoot);

  const codeFile = path.join(resolvedSnapshotDir, "code.tar.gz");
  if (!fs.existsSync(codeFile)) {
    throw new Error(`code.tar.gz not found in snapshot dir: ${resolvedSnapshotDir}`);
  }

  if (!yes) {
    console.error("❌ 중단: --yes 옵션이 필요합니다.");
    console.error("이 스크립트는 코드 아카이브를 지정한 폴더에 풀어줍니다(덮어쓰기 방지).");
    console.error("실행 예시:");
    console.error("  pnpm run code:restore-snapshot -- --yes");
    console.error("  pnpm run code:restore-snapshot -- --dir /tmp/club-attendance-restore --yes");
    console.error(
      "  pnpm run code:restore-snapshot -- --snapshot ../snapshots/snapshot-XXXX --dir /tmp/restore --yes"
    );
    process.exit(1);
  }

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.error("❌ 중단: 대상 폴더가 비어있지 않습니다.");
    console.error("대상:", targetDir);
    console.error("안전을 위해 빈 폴더만 허용합니다. (다른 폴더를 지정하거나 비워주세요)");
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  console.log("🧰 코드 스냅샷 복구 시작");
  console.log("📦 code archive:", codeFile);
  console.log("📁 target dir:", targetDir);

  execFileSync("tar", ["-xzf", codeFile, "-C", targetDir], { stdio: "inherit" });

  console.log("\n✅ 코드 복구 완료");
  console.log("다음 단계(수동):");
  console.log(`  1) cd "${targetDir}"`);
  console.log("  2) (필요 시) pnpm install");
  console.log("  3) 서버/클라이언트 실행");
}

main();


