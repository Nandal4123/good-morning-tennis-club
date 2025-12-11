# 최종 해결 방법 (확실한 방법)

## 현재 상황
여러 번 시도했지만 계속 문제가 발생하고 있습니다. 이제 **확실하게** 해결하겠습니다.

## 🔴 실제 문제

Render 서버의 `DATABASE_URL` 환경 변수가 올바르게 설정되지 않았습니다.

## ✅ 확실한 해결 방법 (단계별)

### 1단계: Supabase에서 정확한 연결 문자열 복사

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings → Database 클릭**

3. **Connection string 섹션 찾기**

4. **Transaction mode 선택** (Session mode 아님)

5. **연결 문자열 복사**
   - 형식: `postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true`
   - 또는 직접 구성:
     ```
     postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
     ```

### 2단계: Render에서 DATABASE_URL 설정

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - `tennis-club-server` 서비스 선택

2. **Environment 탭 클릭**

3. **DATABASE_URL 확인**
   - **없으면**: "Add Environment Variable" 클릭
   - **있으면**: Edit 클릭

4. **값 입력** (중요: 따옴표 없이, 공백 없이):
   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
   ```

5. **Save Changes 클릭**

### 3단계: 서버 재시작

1. **Manual Deploy 클릭**
2. **"Clear build cache & deploy" 선택**
3. **Deploy 클릭**
4. **배포 완료까지 대기** (2-5분)

### 4단계: 확인

배포 완료 후:

```bash
# 1. Health Check
curl https://tennis-club-server.onrender.com/api/health

# 2. Users API
curl https://tennis-club-server.onrender.com/api/users

# 3. Monthly Stats API
curl https://tennis-club-server.onrender.com/api/users/with-monthly-stats?year=2025&month=12
```

**모든 API가 성공하면 해결 완료입니다.**

## 🔍 문제가 계속되면

### Render 로그 확인
1. Render 대시보드 → Logs 탭
2. 최근 에러 메시지 확인:
   - `❌ Failed to initialize Prisma Client` → DATABASE_URL 문제
   - `DATABASE_URL: Not set` → 환경 변수 미설정
   - `MaxClientsInSessionMode` → 연결 풀 제한

### DATABASE_URL 재확인
- Supabase에서 연결 문자열을 다시 복사
- Render에 정확히 붙여넣기 (수동 입력 금지)
- 따옴표나 공백이 없는지 확인

## ✅ 성공 기준

다음이 모두 성공하면 해결 완료:
- ✅ Health Check API: `{"status":"ok"}`
- ✅ Users API: 사용자 배열 반환
- ✅ User Stats API: 통계 데이터 반환
- ✅ Monthly Stats API: 월별 통계 반환

## 📝 참고

이번에는 **Supabase에서 직접 복사한 연결 문자열**을 사용하세요. 수동으로 입력하지 마세요.

