# Render Shell 마이그레이션 해결 방법

## 문제 상황
- `P3005` 오류: "The database schema is not empty"
- 기존 데이터베이스에 스키마가 이미 있어서 마이그레이션을 적용할 수 없음

## 해결 방법

### 방법 1: prisma db push 사용 (권장, 가장 간단)

Render Shell에서 다음 명령 실행:

```bash
pwd  # 현재 디렉토리 확인 (이미 ~/project/src/server에 있을 가능성 높음)
pnpm prisma db push
```

**장점:**
- 마이그레이션 히스토리 없이 스키마만 동기화
- 기존 데이터베이스에 안전하게 컬럼 추가
- 빠르고 간단

**주의:**
- `db push`는 마이그레이션 파일을 생성하지 않습니다
- 프로덕션에서는 일반적으로 `migrate deploy`를 사용하지만, 이 경우는 예외

### 방법 2: 기존 마이그레이션을 baseline으로 설정

만약 마이그레이션 히스토리를 유지하고 싶다면:

```bash
# 1. 기존 마이그레이션을 baseline으로 표시
pnpm prisma migrate resolve --applied <migration_name>

# 2. 새 마이그레이션 생성
pnpm prisma migrate dev --name add_club_password_fields --create-only

# 3. 마이그레이션 적용
pnpm prisma migrate deploy
```

### 방법 3: SQL 직접 실행 (고급)

Prisma가 자동으로 생성한 SQL을 확인하고 수동으로 실행:

```bash
# 마이그레이션 SQL 생성 (적용하지 않음)
pnpm prisma migrate dev --create-only --name add_club_password_fields

# 생성된 SQL 파일 확인
cat prisma/migrations/*/migration.sql

# Supabase에서 직접 SQL 실행
```

## 권장 순서

1. **현재 디렉토리 확인:**
   ```bash
   pwd
   ls -la
   ```

2. **prisma db push 실행:**
   ```bash
   pnpm prisma db push
   ```

3. **확인:**
   ```bash
   pnpm prisma studio
   # 또는
   pnpm prisma db pull  # 스키마가 올바르게 동기화되었는지 확인
   ```

## 예상 결과

`prisma db push` 실행 후:
- `clubs` 테이블에 `adminPasswordHash`, `joinCodeHash` 컬럼이 추가됨
- 기존 데이터는 유지됨 (새 컬럼은 NULL)
- Owner 대시보드에서 클럽 추가/비밀번호 변경 기능 사용 가능

## 문제 해결

### 오류: "No such file or directory"
- `pwd`로 현재 디렉토리 확인
- `ls -la`로 파일 목록 확인
- 필요시 `cd ~/project/src/server` 명시적으로 이동

### 오류: "Command prisma not found"
- `pnpm install` 실행
- `which prisma` 또는 `pnpm exec prisma --version` 확인




