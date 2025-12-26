# 데이터베이스 마이그레이션 가이드

## 변경 사항
Club 모델에 다음 필드가 추가되었습니다:
- `adminPasswordHash` (String?, 옵셔널)
- `joinCodeHash` (String?, 옵셔널)

## 마이그레이션 방법

### 방법 1: Render Shell에서 마이그레이션 (권장)

1. Render 대시보드에서 서비스 선택
2. "Shell" 탭 클릭
3. 다음 명령 실행:

```bash
cd server
pnpm prisma migrate deploy
```

또는 개발 모드로 (마이그레이션 파일 생성):

```bash
cd server
pnpm prisma migrate dev --name add_club_password_fields
```

### 방법 2: prisma db push 사용 (빠른 동기화)

개발 환경에서 마이그레이션 히스토리 없이 스키마만 동기화:

```bash
cd server
pnpm prisma db push
```

**주의**: `db push`는 마이그레이션 파일을 생성하지 않습니다. 프로덕션에서는 `migrate deploy`를 사용하세요.

### 방법 3: Prisma Studio로 확인

마이그레이션 후 데이터 확인:

```bash
cd server
pnpm prisma studio
```

## 확인 사항

마이그레이션 후 다음을 확인하세요:

1. `clubs` 테이블에 `adminPasswordHash`, `joinCodeHash` 컬럼이 추가되었는지
2. 기존 클럽 데이터가 정상인지
3. Owner 대시보드에서 클럽 추가/비밀번호 변경이 작동하는지

## 문제 해결

### 오류: "Authentication failed"
- Render의 `DATABASE_URL` 환경 변수가 올바른지 확인
- Supabase 연결 정보가 정확한지 확인

### 오류: "Command prisma not found"
- `cd server`로 서버 디렉토리로 이동
- `pnpm install` 실행하여 의존성 설치 확인




