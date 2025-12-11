# 배포 환경 문제 해결 가이드 (상세)

## 🔍 문제 진단 단계

### 1단계: Render 서버 상태 확인

#### 1.1 Health Check
```bash
curl https://tennis-club-server.onrender.com/api/health
```

**예상 응답**:
```json
{"status":"ok","timestamp":"2025-12-11T..."}
```

**문제가 있는 경우**:
- 응답이 없음 → 서버가 다운되었거나 시작 중
- 에러 메시지 → 서버 로그 확인 필요

#### 1.2 Render 대시보드에서 확인
1. https://dashboard.render.com 접속
2. `tennis-club-server` 서비스 선택
3. **Logs 탭** 클릭
4. 최근 에러 메시지 확인:
   - `Circuit breaker open` → DATABASE_URL 문제
   - `Authentication failed` → 비밀번호 문제
   - `Connection refused` → 서버 시작 실패

### 2단계: DATABASE_URL 확인

#### 2.1 현재 설정 확인
Render 대시보드 → Environment 탭에서 `DATABASE_URL` 확인

**올바른 형식**:
```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
```

**확인 사항**:
- ✅ `postgres.tzulmmiudjcoghipoynq` (project-ref)
- ✅ `rjgkqeh12dlfdl` (password)
- ✅ `?pgbouncer=true&connect_timeout=15` (파라미터)
- ✅ 따옴표 없이 입력 (환경 변수는 자동으로 처리)

#### 2.2 DATABASE_URL 재설정
1. Render 대시보드 → Environment 탭
2. `DATABASE_URL` 찾기
3. **Edit** 클릭
4. 전체 연결 문자열 복사/붙여넣기:
   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
   ```
5. **Save Changes** 클릭
6. **Manual Deploy** → **Clear build cache & deploy** 클릭

### 3단계: 서버 재시작

#### 3.1 Render 서버 재시작
1. Render 대시보드 → 서비스 선택
2. **Manual Deploy** 클릭
3. **Clear build cache & deploy** 선택
4. 배포 완료까지 대기 (2-5분)

#### 3.2 배포 상태 확인
- **Status**: Live (초록색)
- **Last Deploy**: 방금 전
- **Logs**: 에러 없음

### 4단계: API 테스트

#### 4.1 Health Check
```bash
curl https://tennis-club-server.onrender.com/api/health
```

#### 4.2 사용자 목록
```bash
curl https://tennis-club-server.onrender.com/api/users
```

#### 4.3 사용자 통계
```bash
curl https://tennis-club-server.onrender.com/api/users/[userId]/stats
```

### 5단계: Vercel 환경 변수 확인

#### 5.1 환경 변수 확인
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. `VITE_API_URL` 확인:
   - 값: `https://tennis-club-server.onrender.com/api`
   - 환경: Production, Preview, Development 모두 체크

#### 5.2 재배포
1. Deployments 탭
2. 최신 배포의 "..." 메뉴
3. **Redeploy** 클릭

### 6단계: 브라우저 확인

#### 6.1 개발자 도구 열기
- F12 또는 Cmd+Option+I (Mac)

#### 6.2 Console 탭 확인
다음 메시지들을 확인:

**정상적인 경우**:
```
[API] 🚀 프로덕션 모드: API_BASE = https://tennis-club-server.onrender.com/api
[API] 📞 Calling: https://tennis-club-server.onrender.com/api/users/...
[API] ✅ Success from ...
```

**문제가 있는 경우**:
```
[API] ❌ Error ...
[API] ❌ Network error: Failed to fetch ...
```

#### 6.3 Network 탭 확인
1. Network 탭 클릭
2. 페이지 새로고침 (Cmd+R)
3. `/api/users/...` 요청 찾기
4. 클릭하여 확인:
   - **Status**: 200 OK (정상) 또는 500/404 (에러)
   - **Response**: 데이터가 있는지 확인
   - **Headers**: 요청 URL 확인

## 🐛 일반적인 문제와 해결 방법

### 문제 1: "Circuit breaker open: Too many authentication errors"

**원인**: DATABASE_URL이 잘못되었거나 비밀번호가 틀림

**해결**:
1. Supabase 대시보드에서 연결 문자열 재확인
2. Render의 DATABASE_URL 재설정
3. 서버 재시작

### 문제 2: "Failed to fetch"

**원인**: 
- Render 서버가 다운됨
- CORS 문제
- 네트워크 문제

**해결**:
1. Render 서버 상태 확인
2. Health check API 테스트
3. 브라우저 캐시 삭제

### 문제 3: API는 성공하지만 데이터가 0

**원인**: 
- 데이터베이스에 데이터가 없음
- 필터링 로직 문제
- 날짜 계산 문제

**해결**:
1. 데이터베이스에 실제 데이터가 있는지 확인
2. 브라우저 콘솔에서 API 응답 확인
3. 로컬 환경에서 테스트

### 문제 4: Vercel에서 API 호출 실패

**원인**: 
- `VITE_API_URL` 환경 변수 미설정
- 잘못된 API URL

**해결**:
1. Vercel 환경 변수 확인
2. `VITE_API_URL` 설정
3. 재배포

## 🔧 단계별 체크리스트

### Render 서버
- [ ] DATABASE_URL이 올바른 형식인지 확인
- [ ] 서버가 Live 상태인지 확인
- [ ] Logs에 에러가 없는지 확인
- [ ] Health check API가 정상 응답하는지 확인
- [ ] 최근 재시작했는지 확인

### Vercel 프론트엔드
- [ ] `VITE_API_URL` 환경 변수가 설정되어 있는지 확인
- [ ] 환경 변수 값이 올바른지 확인
- [ ] 최신 코드가 배포되었는지 확인
- [ ] 브라우저 콘솔에서 API 호출이 성공하는지 확인

### 브라우저
- [ ] 캐시 삭제 또는 시크릿 모드 사용
- [ ] 개발자 도구에서 에러 확인
- [ ] Network 탭에서 API 응답 확인

## 📞 추가 도움

문제가 계속되면 다음 정보를 수집하세요:

1. **Render 서버 로그** (최근 50줄)
2. **브라우저 콘솔 에러** (스크린샷)
3. **Network 탭** (API 요청/응답 스크린샷)
4. **Health check 결과**:
   ```bash
   curl https://tennis-club-server.onrender.com/api/health
   ```

