import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { snapshotDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--snapshot") args.snapshotDir = argv[i + 1];
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
  const { snapshotDir } = parseArgs(process.argv.slice(2));
  const projectRoot = path.join(__dirname, "..", "..");
  const snapshotsRoot = path.join(projectRoot, "snapshots");

  const dir = snapshotDir
    ? path.isAbsolute(snapshotDir)
      ? snapshotDir
      : path.join(process.cwd(), snapshotDir)
    : resolveLatestSnapshotDir(projectRoot);

  const name = path.basename(dir);
  const outFile = path.join(snapshotsRoot, `${name}.tar.gz`);

  console.log("📦 Snapshot 번들 생성");
  console.log("📁 snapshot:", dir);
  console.log("🗜️  output:", outFile);

  // snapshotsRoot 기준으로 tar 생성 (경로가 짧아져서 복원/이동이 쉽다)
  execFileSync("tar", ["-czf", outFile, "-C", snapshotsRoot, name], {
    stdio: "inherit",
  });

  console.log("✅ 번들 생성 완료:", outFile);
  console.log("이 파일 하나만 외장/클라우드로 복사해두면 됩니다.");
}

main();


