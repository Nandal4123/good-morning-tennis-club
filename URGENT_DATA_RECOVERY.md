# 🚨 긴급 데이터 복구 가이드

## 현재 상황
데이터가 손실되었습니다. 스냅샷에서 복구해야 합니다.

## 사용 가능한 스냅샷

다음 스냅샷들이 있습니다:
- `snapshot-2025-12-18T05-26-42` (가장 최신)
- `snapshot-2025-12-18T05-18-50`
- `snapshot-2025-12-17T03-48-32`
- `snapshot-2025-12-17T01-53-44`

## 복구 방법

### 방법 1: Render Shell에서 자동 복구 (권장)

Render Shell에서 다음 명령을 실행하세요:

```bash
# 1. 현재 디렉토리 확인
pwd

# 2. 최신 스냅샷으로 복구
pnpm run db:restore-snapshot -- --yes
```

**주의**: 이 명령은 기존 데이터베이스의 모든 데이터를 삭제하고 스냅샷으로 교체합니다.

### 방법 2: 특정 스냅샷으로 복구

특정 스냅샷을 선택하려면:

```bash
# 스냅샷 목록 확인
pnpm run snapshot:list

# 특정 스냅샷으로 복구 (예: snapshot-2025-12-18T05-26-42)
pnpm run db:restore-snapshot -- --file ../snapshots/snapshot-2025-12-18T05-26-42/db.json --yes
```

### 방법 3: 수동 SQL 복구 (고급)

스냅샷 파일을 직접 읽어서 SQL로 복구:

1. 스냅샷 파일 다운로드: `snapshots/snapshot-2025-12-18T05-26-42/db.json`
2. Supabase 대시보드에서 SQL Editor 열기
3. JSON 데이터를 기반으로 INSERT 문 생성 및 실행

## 복구 후 확인

복구 후 다음을 확인하세요:

```bash
# 1. 클럽 목록 확인
pnpm run db:check-clubs

# 2. 데이터베이스 상태 확인
pnpm run db:check-schema

# 3. Prisma Client 재생성
pnpm run db:generate
```

## 복구 전 백업

복구 스크립트는 자동으로 복구 전 백업을 생성합니다:
- 위치: `snapshots/pre-restore/pre-restore-db-YYYY-MM-DDTHH-MM-SS.json`

이 백업을 사용하여 나중에 되돌릴 수 있습니다.

## 주의사항

⚠️ **복구는 파괴적 작업입니다**
- 기존 데이터베이스의 모든 데이터가 삭제됩니다
- 스냅샷 이후에 생성된 데이터는 모두 손실됩니다
- 복구 전에 현재 상태를 백업하는 것을 권장합니다

## 문제 해결

### 오류: "Snapshot file not found"
- 스냅샷 파일 경로 확인
- `pnpm run snapshot:list`로 사용 가능한 스냅샷 확인

### 오류: "Database connection failed"
- Render의 `DATABASE_URL` 환경 변수 확인
- Supabase 연결 정보 확인

### 복구 후 데이터가 보이지 않음
- Prisma Client 재생성: `pnpm run db:generate`
- 서버 재시작
- 브라우저 캐시 삭제

## 다음 단계

1. ✅ 데이터 복구 완료
2. ✅ Prisma Client 재생성
3. ✅ 서버 재시작
4. ✅ Owner 대시보드에서 데이터 확인
5. ✅ 클럽 추가/비밀번호 변경 기능 테스트

