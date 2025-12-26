# 🚨 긴급 데이터 복구 - 모든 데이터 복구

## 현재 상황
모든 데이터가 손실되었습니다. 스냅샷에서 즉시 복구해야 합니다.

## 복구 방법

### Render Shell에서 실행 (가장 빠른 방법)

Render Shell에서 다음 명령을 실행하세요:

```bash
# 1. 현재 위치 확인
pwd

# 2. 최신 스냅샷으로 복구 (자동으로 최신 스냅샷 찾음)
pnpm run db:restore-snapshot -- --yes
```

**주의**: 이 명령은 기존 데이터베이스의 모든 데이터를 삭제하고 스냅샷으로 교체합니다.

### 특정 스냅샷으로 복구

가장 최신 스냅샷: `snapshot-2025-12-18T05-26-42`

```bash
# 스냅샷 파일 경로 지정
pnpm run db:restore-snapshot -- --file ../snapshots/snapshot-2025-12-18T05-26-42/db.json --yes
```

### 스냅샷 파일이 없는 경우

스냅샷 파일이 Render 서버에 없다면:

1. **로컬에서 스냅샷 파일 확인:**
   - `snapshots/snapshot-2025-12-18T05-26-42/db.json`

2. **GitHub에 푸시:**
   ```bash
   git add snapshots/snapshot-2025-12-18T05-26-42/db.json
   git commit -m "emergency: 스냅샷 파일 추가"
   git push
   ```

3. **Render Shell에서 복구:**
   ```bash
   pnpm run db:restore-snapshot -- --file ../snapshots/snapshot-2025-12-18T05-26-42/db.json --yes
   ```

## 복구 후 확인

복구가 완료되면 다음을 확인하세요:

```bash
# 1. 클럽 목록 확인
pnpm run db:check-clubs

# 2. 데이터베이스 상태 확인
pnpm run db:check-schema

# 3. Prisma Client 재생성
pnpm run db:generate
```

## 복구 전 백업

복구 스크립트는 자동으로 복구 직전 상태를 백업합니다:
- 위치: `snapshots/pre-restore/pre-restore-db-YYYY-MM-DDTHH-MM-SS.json`

이 백업을 사용하여 나중에 되돌릴 수 있습니다.

## 문제 해결

### 오류: "Snapshot file not found"
- 스냅샷 파일이 GitHub에 푸시되었는지 확인
- `ls -la ../snapshots/` 로 파일 확인

### 오류: "Database connection failed"
- Render의 `DATABASE_URL` 환경 변수 확인
- Supabase 연결 정보 확인

### 복구 후 데이터가 보이지 않음
- Prisma Client 재생성: `pnpm run db:generate`
- 서버 재시작
- 브라우저 캐시 삭제

## 다음 단계

1. ✅ Render Shell에서 복구 명령 실행
2. ✅ 복구 완료 확인
3. ✅ Prisma Client 재생성
4. ✅ 서버 재시작
5. ✅ Owner 대시보드에서 데이터 확인




