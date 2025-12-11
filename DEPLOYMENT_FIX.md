# 배포 환경 문제 해결 가이드

## 🔴 현재 문제

배포된 사이트 (https://good-morning-tennis-club.vercel.app/)에서 데이터가 표시되지 않음

**주요 원인**: Render 서버의 데이터베이스 연결 오류

```
Error: Circuit breaker open: Too many authentication errors
```

## ✅ 해결 방법

### 1단계: Render 서버 데이터베이스 연결 수정

#### 1.1 Supabase 연결 정보 확인

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. Settings → Database → Connection string → Session mode 선택
4. 연결 문자열 복사 (형식: `postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres`)

#### 1.2 Render 서버 환경 변수 업데이트

1. Render 대시보드 접속: https://dashboard.render.com
2. 서비스 선택: `tennis-club-server`
3. Environment 탭 클릭
4. `DATABASE_URL` 환경 변수 찾기
5. **새로운 연결 문자열로 업데이트**:

   **옵션 1: Direct Connection (권장 - 연결 풀 제한 없음)**

   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.connect.psdb.cloud:5432/postgres?sslmode=require
   ```

   **옵션 2: Transaction Mode (연결 풀 사용, 제한 있음)**

   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
   ```

   ⚠️ **중요**:

   - **옵션 1 (Direct)을 먼저 시도하세요** - 연결 풀 제한 문제 해결
   - project-ref: `tzulmmiudjcoghipoynq`
   - password: `rjgkqeh12dlfdl`
   - Direct connection은 `connect.psdb.cloud` 사용 (pooler 대신)
   - Transaction mode는 `pooler.supabase.com` 사용

#### 1.3 Render 서버 재시작

1. Render 대시보드에서 서비스 선택
2. Manual Deploy → Clear build cache & deploy 클릭
3. 또는 Settings → Manual Deploy → Deploy latest commit

#### 1.4 연결 확인

```bash
# 서버가 재시작된 후 확인
curl https://tennis-club-server.onrender.com/api/health

# 정상 응답 예시:
# {"status":"ok","timestamp":"2025-12-11T..."}
```

---

### 2단계: Vercel 환경 변수 설정

#### 2.1 Vercel 프로젝트 설정

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 선택: `good-morning-tennis-club`
3. Settings → Environment Variables 클릭

#### 2.2 환경 변수 추가

**변수명**: `VITE_API_URL`  
**값**: `https://tennis-club-server.onrender.com/api`  
**환경**: Production, Preview, Development 모두 선택

#### 2.3 재배포

1. Deployments 탭 클릭
2. 최신 배포의 "..." 메뉴 → Redeploy 클릭
3. 또는 Git에 푸시하면 자동 재배포

---

### 3단계: 최신 코드 배포 확인

#### 3.1 Git 푸시 확인

```bash
cd club-attendance
git status  # 모든 변경사항이 커밋되었는지 확인
git push    # 원격 저장소에 푸시
```

#### 3.2 배포 상태 확인

- **Vercel**: Deployments 탭에서 최신 배포 상태 확인
- **Render**: Deployments 탭에서 최신 배포 상태 확인

---

### 4단계: 검증

#### 4.1 서버 상태 확인

```bash
# Health check
curl https://tennis-club-server.onrender.com/api/health

# 사용자 통계 확인 (userId는 실제 사용자 ID로 교체)
curl https://tennis-club-server.onrender.com/api/users/[userId]/stats
```

#### 4.2 프론트엔드 확인

1. 브라우저에서 https://good-morning-tennis-club.vercel.app/ 접속
2. 개발자 도구 열기 (F12)
3. Console 탭에서 확인:
   - `[API] 🚀 프로덕션 모드: API_BASE = https://tennis-club-server.onrender.com/api`
   - `[API] ✅ Success from ...` 메시지 확인
4. Network 탭에서 API 호출 확인:
   - `/api/users/[userId]/stats` 요청이 200 OK인지 확인
   - 응답 데이터가 있는지 확인

#### 4.3 대시보드 확인

- ✅ 이달의 출석: 숫자 표시
- ✅ 총 경기 수: 숫자 표시
- ✅ 총출석: 숫자 표시
- ✅ 승리: 숫자 표시
- ✅ 월별 랭킹: 데이터 표시

---

## 🔧 문제 해결 체크리스트

### Render 서버

- [ ] DATABASE_URL 환경 변수가 올바른 Supabase 연결 문자열인지 확인
- [ ] 연결 문자열에 `?pgbouncer=true&connect_timeout=15` 파라미터가 있는지 확인
- [ ] 서버가 재시작되었는지 확인
- [ ] Health check API가 정상 응답하는지 확인

### Vercel 프론트엔드

- [ ] `VITE_API_URL` 환경 변수가 설정되어 있는지 확인
- [ ] 환경 변수 값이 `https://tennis-club-server.onrender.com/api`인지 확인
- [ ] 최신 코드가 배포되었는지 확인
- [ ] 브라우저 콘솔에서 API 호출이 성공하는지 확인

### 코드

- [ ] 최신 변경사항이 Git에 커밋되었는지 확인
- [ ] Git에 푸시되었는지 확인
- [ ] Vercel과 Render가 최신 코드를 배포했는지 확인

---

## 🆘 추가 문제 해결

### 문제: 여전히 데이터가 표시되지 않음

1. **브라우저 캐시 삭제**

   - Cmd+Shift+Delete (Mac) 또는 Ctrl+Shift+Delete (Windows)
   - 캐시된 이미지 및 파일 선택 → 삭제
   - 또는 시크릿 모드로 접속

2. **서버 로그 확인**

   - Render 대시보드 → Logs 탭에서 에러 확인
   - Vercel 대시보드 → Functions 탭에서 에러 확인

3. **데이터베이스 연결 재확인**

   - Supabase 대시보드에서 연결 정보 재확인
   - 비밀번호가 변경되지 않았는지 확인

4. **환경 변수 재설정**
   - Render와 Vercel 모두 환경 변수 재설정
   - 서버 재시작

---

## 📝 참고사항

### DATABASE_URL 형식

```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
```

**실제 값**:

- project-ref: `tzulmmiudjcoghipoynq`
- password: `rjgkqeh12dlfdl`

### 중요 파라미터

- `pgbouncer=true`: 연결 풀링 활성화 (필수)
- `connect_timeout=15`: 연결 타임아웃 설정

### 로컬 vs 배포

- **로컬**: `http://localhost:5001/api` (자동 설정)
- **배포**: `https://tennis-club-server.onrender.com/api` (환경 변수 필요)

---

## ✅ 완료 후 확인사항

1. ✅ Render 서버 Health check 성공
2. ✅ Vercel 환경 변수 설정 완료
3. ✅ 최신 코드 배포 완료
4. ✅ 브라우저에서 데이터 정상 표시
5. ✅ 월별 랭킹 정상 작동
