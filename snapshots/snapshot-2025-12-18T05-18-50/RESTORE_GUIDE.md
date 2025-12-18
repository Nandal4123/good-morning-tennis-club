# Snapshot Restore Guide

이 폴더는 특정 시점의 **DB 데이터 + 코드** 스냅샷입니다.

## 포함 파일
- `db.json`: Prisma 기반 DB 덤프(JSON)
- `code.tar.gz`: 코드 아카이브(대용량 제외: node_modules/dist/snapshots/.git)
- `checksums.sha256`: 무결성 검증용 SHA-256 체크섬
- `manifest.json`: 스냅샷 메타데이터(체크섬/버전/런타임)

## 복구(코드)
> 현재 작업 폴더를 덮어쓸 수 있으니, 복구는 별도 폴더에서 진행하는 것을 권장합니다.

```bash
mkdir -p /tmp/club-attendance-restore
tar -xzf "/Users/a000/Library/Mobile Documents/com~apple~CloudDocs/AI연구소/Good morning club/club-attendance/snapshots/snapshot-2025-12-18T05-18-50/code.tar.gz" -C /tmp/club-attendance-restore
```

## 복구(DB)
⚠️ 이 작업은 DB 데이터를 삭제한 뒤 스냅샷으로 다시 채웁니다.

```bash
cd "/Users/a000/Library/Mobile Documents/com~apple~CloudDocs/AI연구소/Good morning club/club-attendance/server"
pnpm run db:restore-snapshot -- --file "/Users/a000/Library/Mobile Documents/com~apple~CloudDocs/AI연구소/Good morning club/club-attendance/snapshots/snapshot-2025-12-18T05-18-50/db.json" --yes
```

## 검증(권장)
```bash
cd "/Users/a000/Library/Mobile Documents/com~apple~CloudDocs/AI연구소/Good morning club/club-attendance/server"
pnpm run snapshot:verify -- --snapshot "/Users/a000/Library/Mobile Documents/com~apple~CloudDocs/AI연구소/Good morning club/club-attendance/snapshots/snapshot-2025-12-18T05-18-50"
```

## 권장 순서
1) 코드 복구
2) DB 복구
3) 서버/클라이언트 재시작
