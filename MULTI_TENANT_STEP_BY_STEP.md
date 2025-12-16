# 🚀 멀티 테넌트 구축 단계별 가이드

멀티 테넌트를 단계별로 구축하는 완전한 가이드입니다.

---

## 📋 전체 단계 개요

1. ✅ **데이터베이스 스키마 준비** (완료)
2. ⏳ **기본 클럽 생성 및 데이터 마이그레이션**
3. ⏳ **미들웨어 구현** (진행 중)
4. ⏳ **모든 컨트롤러 수정**
5. ⏳ **프론트엔드 수정**
6. ⏳ **테스트 및 검증**

---

## Step 1: 데이터베이스 스키마 준비 ✅

### 완료된 작업
- ✅ Club 모델 추가
- ✅ 모든 모델에 clubId 필드 추가 (옵셔널)
- ✅ 관계 설정
- ✅ 인덱스 추가

### 현재 상태
- `clubId`는 옵셔널 (null 허용)
- 기존 데이터는 `clubId`가 null
- 정상 작동 중

---

## Step 2: 기본 클럽 생성 및 데이터 마이그레이션

### 2-1. 데이터 백업 (필수!)

```bash
cd server
pnpm run db:backup
```

### 2-2. 기본 클럽 생성 및 데이터 마이그레이션

```bash
cd server
node scripts/create-default-club.js
```

이 스크립트는:
1. 기본 클럽 생성 (subdomain: "default")
2. 모든 기존 사용자에 clubId 할당
3. 모든 기존 세션에 clubId 할당
4. 모든 기존 경기에 clubId 할당

### 2-3. 데이터베이스 스키마 적용

```bash
cd server
pnpm run db:push
```

이 명령어는:
- Club 테이블 생성
- clubId 컬럼 추가
- 관계 및 인덱스 생성

---

## Step 3: 미들웨어 구현 ✅

### 완료된 작업
- ✅ `clubResolver.js` 미들웨어 생성
- ✅ 서브도메인, 헤더, 쿼리 파라미터 지원
- ✅ `index.js`에 미들웨어 적용

### 다음 단계
- 환경 변수 설정
- 테스트

---

## Step 4: 모든 컨트롤러 수정

### 4-1. UserController 수정

**수정할 함수:**
- `getAllUsers` ✅ (완료)
- `getUserById` - clubId 필터 추가
- `createUser` - clubId 자동 할당
- `updateUser` - clubId 검증
- `deleteUser` - clubId 검증
- `getAllUsersWithStats` - clubId 필터 추가
- `getAllUsersWithMonthlyStats` - clubId 필터 추가
- `getUserStats` - clubId 필터 추가
- `getHeadToHead` - clubId 필터 추가

### 4-2. SessionController 수정

**수정할 함수:**
- `getAllSessions` - clubId 필터 추가
- `getTodaySession` - clubId 필터 추가
- `createSession` - clubId 자동 할당

### 4-3. AttendanceController 수정

**수정할 함수:**
- `getAllAttendances` - clubId 필터 추가
- `getAttendancesByUser` - clubId 필터 추가
- `createAttendance` - clubId 자동 할당
- `checkIn` - clubId 자동 할당

### 4-4. MatchController 수정

**수정할 함수:**
- `getAllMatches` - clubId 필터 추가
- `getMatchById` - clubId 검증
- `createMatch` - clubId 자동 할당
- `updateScore` - clubId 검증
- `deleteMatch` - clubId 검증

---

## Step 5: 프론트엔드 수정

### 5-1. 서브도메인 방식 (추천)

**옵션 A: 자동 서브도메인 감지**
```javascript
// 자동으로 서브도메인에서 클럽 정보 추출
const subdomain = window.location.hostname.split('.')[0];
```

**옵션 B: 클럽 선택 화면**
```javascript
// 첫 로그인 시 클럽 선택
// 또는 헤더에 클럽 선택 드롭다운
```

### 5-2. API 호출 수정

```javascript
// 클럽 정보를 헤더에 포함
headers: {
  'X-Club-Subdomain': currentClub.subdomain
}
```

---

## Step 6: 테스트 및 검증

### 6-1. 기본 기능 테스트
- [ ] 사용자 조회 (클럽별 필터 확인)
- [ ] 사용자 생성 (clubId 자동 할당 확인)
- [ ] 경기 등록 (clubId 자동 할당 확인)
- [ ] 출석 체크 (clubId 자동 할당 확인)

### 6-2. 데이터 격리 테스트
- [ ] 클럽 A 사용자는 클럽 B 데이터를 볼 수 없음
- [ ] 클럽별 통계가 정확함
- [ ] 클럽별 경기가 분리됨

---

## 🚨 주의사항

### 마이그레이션 전
1. **반드시 백업**
   ```bash
   pnpm run db:backup
   ```

2. **테스트 환경에서 먼저 실행**
   - 프로덕션 데이터는 안전하게 보관

3. **단계별로 진행**
   - 한 번에 모든 것을 바꾸지 말고
   - 각 단계마다 테스트

---

## 📝 체크리스트

### Step 1: 스키마 준비 ✅
- [x] Club 모델 추가
- [x] clubId 필드 추가 (옵셔널)
- [x] 관계 설정
- [x] 인덱스 추가

### Step 2: 데이터 마이그레이션
- [ ] 데이터 백업
- [ ] 기본 클럽 생성 스크립트 실행
- [ ] 데이터베이스 스키마 적용
- [ ] 마이그레이션 검증

### Step 3: 미들웨어 ✅
- [x] clubResolver 미들웨어 생성
- [x] index.js에 적용
- [ ] 환경 변수 설정
- [ ] 테스트

### Step 4: 컨트롤러 수정
- [ ] UserController (1/9 완료)
- [ ] SessionController
- [ ] AttendanceController
- [ ] MatchController

### Step 5: 프론트엔드
- [ ] 서브도메인 처리
- [ ] API 호출 수정
- [ ] 클럽 선택 UI (필요 시)

### Step 6: 테스트
- [ ] 기능 테스트
- [ ] 데이터 격리 테스트
- [ ] 성능 테스트

---

## 🎯 다음 단계

**지금 바로 할 수 있는 것:**

1. **데이터 백업**
   ```bash
   cd server
   pnpm run db:backup
   ```

2. **기본 클럽 생성 및 마이그레이션**
   ```bash
   node scripts/create-default-club.js
   ```

3. **데이터베이스 스키마 적용**
   ```bash
   pnpm run db:push
   ```

4. **환경 변수 설정**
   ```env
   MULTI_TENANT_MODE=true
   DEFAULT_CLUB_ID=<생성된 클럽 ID>
   CLUB_NAME=Good Morning Club
   CLUB_SUBDOMAIN=default
   ```

준비되면 다음 단계로 진행하겠습니다! 🚀

