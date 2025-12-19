# 문제 분석: `?club=ace-club` 접속 시 굿모닝클럽 데이터 표시

## 🔍 현재 상황

- **URL**: `https://good-morning-tennis-club.vercel.app/?club=ace-club`
- **화면**: 굿모닝클럽 데이터 표시 (송원석, 권태석, 신명배 등)
- **데이터베이스**: `ace-club` 클럽 존재 확인 ✅

## 📊 데이터 흐름 분석

### 1. 클라이언트 측 흐름

#### 1.1 App.jsx - 클럽 정보 로드
```
URL: ?club=ace-club
→ clubApi.getInfo()
→ fetchApi("/club/info")
→ addClubQueryParam("/club/info") → "/club/info?club=ace-club"
→ GET /api/club/info?club=ace-club
```

#### 1.2 Dashboard.jsx - 데이터 로드
```javascript
// 3개의 API를 동시에 호출
Promise.all([
  userApi.getStats(currentUser.id),           // /api/users/{id}/stats?club=ace-club
  attendanceApi.getByUser(currentUser.id),     // /api/attendances/user/{id}?club=ace-club
  matchApi.getAll(),                           // /api/matches?club=ace-club
])

// 랭킹 데이터 로드
userApi.getAllWithMonthlyStats(year, month)   // /api/users/with-monthly-stats?year=2025&month=12&club=ace-club
```

### 2. 서버 측 흐름

#### 2.1 resolveClub 미들웨어
```javascript
// 모든 /api/* 요청이 resolveClub을 거침
app.use("/api", resolveClub);

// resolveClub 동작:
1. isMultiTenantMode(req) 확인 → req.query.club이 있으면 true
2. req.query.club에서 subdomain 추출 → "ace-club"
3. DB에서 클럽 조회 → Club.findUnique({ where: { subdomain: "ace-club" } })
4. req.club = club 설정
```

#### 2.2 컨트롤러에서 클럽 필터 적용
```javascript
// userController.js - getUserStats
const clubId = getClubFilter(req);  // req.club?.id 반환
const where = { id };
if (clubId) {
  where.clubId = clubId;  // ✅ 클럽 필터 적용
}

// userController.js - getAllUsersWithMonthlyStats
const clubId = getClubFilter(req);
const clubWhere = buildClubWhere(req);  // { clubId } 또는 { OR: [{ clubId }, { clubId: null }] }
const users = await req.prisma.user.findMany({
  where: clubWhere,  // ✅ 클럽 필터 적용
});
```

## 🐛 잠재적 문제점

### 문제 1: fetchApi에서 쿼리 파라미터 중복 처리
```javascript
// getAllWithMonthlyStats에서 이미 쿼리 파라미터가 있는 경우
userApi.getAllWithMonthlyStats(year, month)
→ fetchApi(`/users/with-monthly-stats?year=2025&month=12`)
→ addClubQueryParam()가 "?club=ace-club"를 추가해야 함
→ 최종: "/users/with-monthly-stats?year=2025&month=12&club=ace-club"
```

**현재 코드:**
```javascript
// api.js - addClubQueryParam
const separator = url.includes("?") ? "&" : "?";
return `${url}${separator}club=${encodeURIComponent(clubIdentifier)}`;
```

**문제 가능성**: 이미 `club=` 파라미터가 있으면 중복 추가될 수 있음

### 문제 2: getClubFilter가 null 반환
```javascript
// clubInfo.js - getClubFilter
export const getClubFilter = (req) => {
  if (isMultiTenantMode() && req.club?.id) {
    return req.club.id;
  }
  return null;  // ⚠️ null 반환 시 클럽 필터가 적용되지 않음
};
```

**문제 가능성**: 
- `isMultiTenantMode()`가 false 반환
- `req.club`이 설정되지 않음
- `req.club.id`가 없음

### 문제 3: buildClubWhere의 기본 클럽 처리
```javascript
// clubInfo.js - buildClubWhere
if (clubSubdomain === 'default') {
  return {
    ...additionalWhere,
    OR: [
      { clubId },
      { clubId: null },  // ⚠️ 레거시 데이터 포함
    ],
  };
}
```

**문제 가능성**: `ace-club`가 아닌 `default` 클럽으로 해석되면 레거시 데이터도 포함됨

### 문제 4: resolveClub에서 기본 클럽으로 fallback
```javascript
// clubResolver.js
if (!club) {
  // 쿼리 파라미터로 명시적으로 요청된 경우 404 반환
  if (hasExplicitClubQuery) {
    return res.status(404).json({ ... });
  }
  
  // 기본 클럽으로 폴백
  const defaultClub = await req.prisma.club.findFirst({
    where: { subdomain: 'default' },
  });
  req.club = defaultClub;  // ⚠️ 기본 클럽으로 설정
}
```

**문제 가능성**: `ace-club`를 찾지 못하고 기본 클럽으로 fallback

## 🔧 해결 방안

### 1. fetchApi 개선 (완료)
- URL에서 직접 클럽 파라미터 읽기
- 중복 파라미터 방지 로직 추가
- 헤더에도 클럽 정보 추가 (이중 보장)

### 2. resolveClub 로깅 강화 필요
- 클럽 조회 실패 시 상세 로그 출력
- 모든 클럽 목록 출력
- 쿼리 파라미터 확인

### 3. getClubFilter 검증 필요
- `req.club`이 제대로 설정되었는지 확인
- `isMultiTenantMode()` 반환값 확인

### 4. 서버 로그 확인 필요
- Render 로그에서 `[Club Resolver]` 로그 확인
- `[Club Info]` 로그 확인
- 각 API 호출 시 `req.club` 값 확인

## 📋 체크리스트

### 클라이언트 측
- [ ] 브라우저 콘솔에서 `[API] 📞 Calling` 로그 확인
- [ ] 모든 API 호출에 `?club=ace-club` 포함 확인
- [ ] `[API] ✅ 클럽 파라미터 확인` 로그 확인

### 서버 측
- [ ] Render 로그에서 `[Club Resolver] 클럽 식별자 (쿼리 파라미터, 최우선): ace-club` 확인
- [ ] `[Club Resolver] 클럽 확인: Ace Club (ace-club)` 로그 확인
- [ ] `[Club Resolver] ❌ 클럽을 찾을 수 없음` 에러 로그 확인
- [ ] 각 API 컨트롤러에서 `clubId` 값 확인

### 데이터베이스
- [x] `ace-club` 클럽 존재 확인 ✅
- [ ] `ace-club` 클럽의 `id` 값 확인
- [ ] `ace-club` 클럽에 속한 사용자 확인
- [ ] `ace-club` 클럽에 속한 데이터 확인

## 🎯 다음 단계

1. **서버 로그 확인**: Render 로그에서 클럽 해석 과정 확인
2. **브라우저 콘솔 확인**: 클라이언트에서 API 호출 로그 확인
3. **네트워크 탭 확인**: 실제 HTTP 요청에 클럽 파라미터 포함 여부 확인
4. **데이터베이스 직접 확인**: `ace-club` 클럽에 실제 데이터가 있는지 확인

