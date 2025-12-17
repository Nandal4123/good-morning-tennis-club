# 🔄 멀티 테넌트 마이그레이션 체크리스트

데이터베이스 마이그레이션을 안전하게 진행하기 위한 체크리스트입니다.

---

## ⚠️ 중요: 마이그레이션 전 확인사항

### 1. 데이터 백업 (필수!)
```bash
cd server
pnpm run db:backup
```

### 2. 현재 데이터 확인
- 사용자 수 확인
- 세션 수 확인
- 경기 수 확인
- 출석 기록 수 확인

### 3. 환경 변수 확인
`.env` 파일에 다음이 설정되어 있는지 확인:
- `DATABASE_URL` - 데이터베이스 연결 문자열
- `CLUB_NAME` - 기본 클럽 이름 (선택사항)
- `CLUB_SUBDOMAIN` - 기본 클럽 서브도메인 (선택사항, 기본값: "default")

---

## 📋 마이그레이션 단계

### Step 1: Prisma Client 재생성
```bash
cd server
pnpm run db:generate
```

**목적:** 새로운 스키마(Club 모델)를 반영

---

### Step 2: 데이터베이스 스키마 적용
```bash
cd server
pnpm run db:push
```

**목적:**
- Club 테이블 생성
- 모든 테이블에 clubId 컬럼 추가
- 관계 및 인덱스 생성

**예상 결과:**
- ✅ Club 테이블 생성됨
- ✅ users, sessions, matches 테이블에 clubId 컬럼 추가됨
- ✅ 기존 데이터의 clubId는 null로 유지됨

---

### Step 3: 기본 클럽 생성 및 데이터 마이그레이션
```bash
cd server
node scripts/create-default-club.js
```

**목적:**
- 기본 클럽 생성 (subdomain: "default")
- 모든 기존 데이터에 clubId 할당

**예상 결과:**
- ✅ 기본 클럽 생성됨
- ✅ 모든 사용자에 clubId 할당됨
- ✅ 모든 세션에 clubId 할당됨
- ✅ 모든 경기에 clubId 할당됨

---

### Step 4: 환경 변수 설정
`.env` 파일에 추가:
```env
MULTI_TENANT_MODE=false  # MVP 모드 유지 (true로 변경 시 멀티 테넌트 활성화)
DEFAULT_CLUB_ID=<생성된 클럽 ID>  # 스크립트 실행 후 출력된 ID
CLUB_NAME=Good Morning Club
CLUB_SUBDOMAIN=default
```

---

### Step 5: 검증
```bash
cd server
pnpm run db:studio
```

**확인 사항:**
- [ ] Club 테이블에 기본 클럽이 생성되었는지
- [ ] 모든 사용자의 clubId가 설정되었는지
- [ ] 모든 세션의 clubId가 설정되었는지
- [ ] 모든 경기의 clubId가 설정되었는지
- [ ] null인 clubId가 없는지

---

## 🚨 문제 발생 시 롤백 방법

### 롤백이 필요한 경우:
1. 데이터베이스 백업에서 복원
2. 또는 clubId 컬럼을 null로 되돌리기

---

## ✅ 마이그레이션 완료 확인

### 성공 기준:
- [ ] Club 테이블이 생성됨
- [ ] 기본 클럽이 생성됨
- [ ] 모든 데이터에 clubId가 할당됨
- [ ] null인 clubId가 없음
- [ ] 기존 기능이 정상 작동함

---

**준비되면 Step 1부터 순차적으로 진행하세요!** 🚀

