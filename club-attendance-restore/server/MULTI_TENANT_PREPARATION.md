# 🔧 멀티 테넌트 전환 준비 작업 완료

MVP에서 수익화 모델(SaaS)로 전환하기 위한 준비 작업이 완료되었습니다.

---

## ✅ 완료된 작업

### 1. 데이터베이스 스키마 준비
- ✅ 모든 모델에 `clubId` 필드 옵셔널로 추가
  - `User` 모델
  - `Session` 모델
  - `Match` 모델
- ✅ `Club` 모델 주석으로 준비 (전환 시 활성화)
- ✅ 마이그레이션 주석 추가

### 2. 유틸리티 함수 추가
- ✅ `server/src/utils/clubInfo.js` 생성
  - `getClubFilter()`: 클럽 필터 반환
  - `getClubInfo()`: 클럽 정보 반환
  - `buildClubWhere()`: where 조건 생성
  - `isMultiTenantMode()`: 모드 확인

### 3. 마이그레이션 스크립트 준비
- ✅ `server/scripts/prepare-multi-tenant-migration.js` 생성
  - 기본 클럽 생성
  - 기존 데이터에 clubId 할당
  - 마이그레이션 검증

### 4. 환경 변수 설정
- ✅ `MULTI_TENANT_MODE` 환경 변수 준비
- ✅ `DEFAULT_CLUB_ID` 환경 변수 준비
- ✅ `CLUB_NAME` 환경 변수 준비
- ✅ `CLUB_SUBDOMAIN` 환경 변수 준비

---

## 📝 환경 변수 설정

### `.env` 파일에 추가

```env
# 멀티 테넌트 모드 (MVP: false, 전환 후: true)
MULTI_TENANT_MODE=false

# 기본 클럽 정보 (MVP 단계에서 사용)
DEFAULT_CLUB_ID=default-club
CLUB_NAME=Good Morning Club
CLUB_SUBDOMAIN=default
```

---

## 🚀 다음 단계

### 현재 상태 (MVP)
- ✅ `clubId` 필드가 옵셔널로 추가됨 (null 허용)
- ✅ 모든 기존 데이터는 `clubId`가 null
- ✅ 단일 클럽 모드로 정상 작동

### 전환 시 할 일

#### 1. 데이터베이스 마이그레이션 실행
```bash
cd server
pnpm run db:prepare-multi-tenant
```

이 스크립트는:
- 기본 클럽 생성
- 모든 기존 데이터에 clubId 할당
- 마이그레이션 검증

#### 2. Prisma 스키마 활성화
`server/prisma/schema.prisma` 파일에서:
- `Club` 모델 주석 해제
- 모든 모델의 `clubId`를 필수로 변경
- 관계(relation) 활성화
- unique 제약조건 및 인덱스 추가

#### 3. 데이터베이스 스키마 적용
```bash
pnpm run db:push
```

#### 4. 환경 변수 변경
```env
MULTI_TENANT_MODE=true
```

#### 5. API 코드 수정
모든 컨트롤러에서 `clubInfo.js` 유틸리티 사용:
```javascript
import { buildClubWhere } from '../utils/clubInfo.js';

export const getAllUsers = async (req, res) => {
  const users = await req.prisma.user.findMany({
    where: buildClubWhere(req),  // 클럽 필터 자동 적용
    orderBy: { name: "asc" },
  });
  res.json(users);
};
```

---

## 📋 체크리스트

### MVP 단계 (현재)
- [x] 데이터베이스 스키마에 clubId 옵셔널 추가
- [x] 유틸리티 함수 생성
- [x] 마이그레이션 스크립트 준비
- [x] 환경 변수 설정
- [ ] 환경 변수 파일(.env) 업데이트
- [ ] 데이터베이스 마이그레이션 실행 (clubId 필드 추가)

### 전환 시
- [ ] 마이그레이션 스크립트 실행
- [ ] Prisma 스키마 활성화
- [ ] 데이터베이스 스키마 적용
- [ ] 환경 변수 변경
- [ ] API 코드 수정
- [ ] 테스트

---

## 🔍 확인 방법

### 현재 상태 확인
```bash
# 데이터베이스 스튜디오에서 확인
pnpm run db:studio

# clubId 필드가 null인지 확인
# 모든 데이터가 정상 작동하는지 확인
```

### 전환 준비 확인
```bash
# 마이그레이션 스크립트 테스트 (dry-run)
node scripts/prepare-multi-tenant-migration.js
```

---

## ⚠️ 주의사항

1. **현재는 clubId가 null**
   - 모든 기존 데이터는 `clubId`가 null
   - 이는 정상이며, MVP 단계에서는 문제없음

2. **전환 전 백업 필수**
   - 마이그레이션 전에 반드시 백업
   ```bash
   pnpm run db:backup
   ```

3. **점진적 전환 권장**
   - 한 번에 모든 것을 바꾸지 말고
   - 단계별로 테스트하며 진행

---

## 📚 관련 문서

- `MVP_TO_MONETIZATION_PATH.md`: 전환 경로 상세 분석
- `IMPLEMENTATION_DIFFICULTY.md`: 구현 난이도 분석
- `MONETIZATION_STRATEGY.md`: 수익화 전략

---

**준비 작업이 완료되었습니다! 이제 MVP 테스트를 진행할 수 있습니다.** 🚀

