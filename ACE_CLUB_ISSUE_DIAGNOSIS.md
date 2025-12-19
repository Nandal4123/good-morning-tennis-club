# 에이스클럽 이동 문제 진단

## 🔍 문제 상황

`https://good-morning-tennis-club.vercel.app/?club=ace-club` 주소로 접속했을 때 굿모닝클럽으로 이동하는 문제

## 💡 원인 분석

### 핵심 문제

**서버 측 `clubResolver.js`에서 클럽을 찾지 못하면 기본 클럽(`default`)으로 폴백하고 있습니다.**

```javascript
// 문제가 되는 코드 (이전)
if (!club) {
  // 기본 클럽 찾기 시도
  const defaultClub = await req.prisma.club.findFirst({
    where: { subdomain: 'default' },
  });
  
  if (defaultClub) {
    req.club = defaultClub;  // ❌ 여기서 굿모닝클럽으로 폴백
    return next();
  }
}
```

### 가능한 원인

1. **데이터베이스에 `ace-club` 클럽이 없음**
   - 에이스클럽이 생성되지 않았거나 삭제됨
   - 서브도메인이 다름 (`ace-club` vs `aceclub` 등)

2. **클럽 해석 실패**
   - 쿼리 파라미터가 제대로 전달되지 않음
   - 서버 측 멀티테넌트 모드가 비활성화됨

3. **기본 클럽 폴백 로직**
   - 클럽을 찾지 못하면 자동으로 `default` 클럽 사용
   - 명시적 요청(`?club=ace-club`)도 폴백됨

---

## 🔧 해결 방법

### 1. 명시적 클럽 요청 시 폴백 방지

**변경 사항**:
- 쿼리 파라미터로 명시적으로 요청된 경우에는 기본 클럽으로 폴백하지 않음
- 명시적 요청은 반드시 해당 클럽이 존재해야 함
- 클럽이 없으면 404 에러 반환

**개선된 코드**:
```javascript
if (!club) {
  // 쿼리 파라미터로 명시적으로 요청된 경우에는 기본 클럽으로 폴백하지 않음
  if (req.query.club && req.query.club.trim() === subdomain) {
    console.error(`[Club Resolver] 명시적 클럽 요청이지만 클럽이 존재하지 않음 - 404 반환`);
    return res.status(404).json({ 
      error: 'Club not found',
      subdomain,
      message: `클럽을 찾을 수 없습니다: ${subdomain}`,
      availableClubs: allClubs.map(c => ({ subdomain: c.subdomain, name: c.name })),
    });
  }
  
  // 기본 클럽 폴백 (쿼리 파라미터가 아닌 경우에만)
  // ...
}
```

### 2. 상세한 디버깅 로그 추가

**추가된 로그**:
- 클럽 조회 시도 로그
- 클럽을 찾을 수 없을 때 상세 정보
- 데이터베이스에 있는 모든 클럽 목록
- 명시적 요청 여부 확인

---

## 🧪 확인 방법

### 1. 데이터베이스 확인

Render Shell에서 실행:
```bash
cd ~/project/src/server
pnpm run db:check-clubs
```

예상 출력:
```
✅ 총 2개의 클럽이 있습니다:

1. Good Morning Club
   서브도메인: default
   ...

2. Ace Club
   서브도메인: ace-club
   ...
```

### 2. 서버 로그 확인

Render 로그에서 다음 메시지 확인:

**정상 작동 시**:
```
[Club Resolver] 클럽 식별자 (쿼리 파라미터, 최우선): ace-club
[Club Resolver] 클럽 조회 시도: subdomain="ace-club"
[Club Resolver] 클럽 확인: Ace Club (ace-club)
```

**문제 발생 시**:
```
[Club Resolver] 클럽 식별자 (쿼리 파라미터, 최우선): ace-club
[Club Resolver] 클럽 조회 시도: subdomain="ace-club"
[Club Resolver] ❌ 클럽을 찾을 수 없음: ace-club
[Club Resolver]   요청된 subdomain: "ace-club"
[Club Resolver]   데이터베이스에 있는 클럽 목록: [...]
[Club Resolver]   명시적 클럽 요청이지만 클럽이 존재하지 않음 - 404 반환
```

### 3. 브라우저 콘솔 확인

브라우저 콘솔에서 다음 로그 확인:

**정상 작동 시**:
```
[ClubContext] 멀티테넌트 모드 활성화 (URL 파라미터): ace-club
[ClubContext] ✅ 클럽 식별자 (URL 파라미터, 최우선): ace-club
[API] 📞 Calling: .../club/info?club=ace-club
[App] ✅ 클럽 정보 로드 완료: { name: "Ace Club", subdomain: "ace-club", ... }
```

**문제 발생 시**:
```
[ClubContext] 멀티테넌트 모드 활성화 (URL 파라미터): ace-club
[ClubContext] ✅ 클럽 식별자 (URL 파라미터, 최우선): ace-club
[API] 📞 Calling: .../club/info?club=ace-club
[App] ⚠️ 클럽 불일치 감지: { expected: "ace-club", actual: "default" }
```

---

## 📋 체크리스트

### 데이터베이스 확인
- [ ] `ace-club` 클럽이 데이터베이스에 존재하는지 확인
- [ ] 서브도메인이 정확히 `ace-club`인지 확인
- [ ] 클럽 이름이 "Ace Club"인지 확인

### 서버 로그 확인
- [ ] `[Club Resolver] 클럽 식별자 (쿼리 파라미터, 최우선): ace-club` 로그 확인
- [ ] `[Club Resolver] 클럽 조회 시도: subdomain="ace-club"` 로그 확인
- [ ] `[Club Resolver] 클럽 확인: Ace Club (ace-club)` 로그 확인
- [ ] 클럽을 찾을 수 없다는 에러 로그 확인

### 클라이언트 로그 확인
- [ ] `[ClubContext] 멀티테넌트 모드 활성화 (URL 파라미터): ace-club` 로그 확인
- [ ] `[ClubContext] ✅ 클럽 식별자 (URL 파라미터, 최우선): ace-club` 로그 확인
- [ ] `[API] 📞 Calling: .../club/info?club=ace-club` 로그 확인
- [ ] `[App] ✅ 클럽 정보 로드 완료` 로그에서 `subdomain: "ace-club"` 확인

---

## 🚀 다음 단계

1. **데이터베이스 확인**
   - Render Shell에서 `pnpm run db:check-clubs` 실행
   - `ace-club` 클럽이 존재하는지 확인

2. **에이스클럽 생성 (없는 경우)**
   ```bash
   cd ~/project/src/server
   node scripts/create-ace-club.js
   ```

3. **서버 로그 확인**
   - Render 로그에서 클럽 해석 과정 확인
   - 에러 메시지 확인

4. **브라우저 테스트**
   - `https://good-morning-tennis-club.vercel.app/?club=ace-club` 접속
   - 브라우저 콘솔 로그 확인
   - Ace Club 대시보드 표시 확인

---

## ✅ 개선 사항

1. **명시적 클럽 요청 시 폴백 방지**
   - `?club=ace-club`로 명시적으로 요청한 경우 기본 클럽으로 폴백하지 않음
   - 클럽이 없으면 404 에러 반환

2. **상세한 디버깅 로그**
   - 클럽 조회 과정 상세 로깅
   - 데이터베이스에 있는 모든 클럽 목록 출력
   - 명시적 요청 여부 확인

3. **에러 메시지 개선**
   - 사용 가능한 클럽 목록 포함
   - 명확한 에러 메시지


