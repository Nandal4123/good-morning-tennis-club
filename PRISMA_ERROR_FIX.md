# PrismaClientInitializationError 해결 가이드

## 🔴 오류 원인

`PrismaClientInitializationError`는 Prisma 클라이언트가 데이터베이스에 연결할 수 없을 때 발생합니다.

**주요 원인**:
1. DATABASE_URL 환경 변수가 설정되지 않음
2. DATABASE_URL 형식이 잘못됨
3. 데이터베이스 서버에 연결할 수 없음
4. 인증 실패 (비밀번호 오류)

## ✅ 해결 방법

### 1단계: Render 서버 DATABASE_URL 확인

1. Render 대시보드 접속: https://dashboard.render.com
2. `tennis-club-server` 서비스 선택
3. **Environment** 탭 클릭
4. `DATABASE_URL` 환경 변수 확인

**올바른 형식**:
```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
```

### 2단계: DATABASE_URL 재설정

만약 DATABASE_URL이 없거나 잘못되었다면:

1. **Edit** 클릭
2. 다음 값 입력:
   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
   ```
3. **Save Changes** 클릭
4. **Manual Deploy** → **Clear build cache & deploy** 클릭

### 3단계: Supabase 연결 정보 확인

만약 위의 연결 문자열이 작동하지 않는다면:

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. **Settings** → **Database**
4. **Connection string** → **Transaction mode** 선택
5. 연결 문자열 복사
6. Render의 DATABASE_URL에 붙여넣기

### 4단계: 서버 재시작

1. Render 대시보드에서 서비스 선택
2. **Manual Deploy** 클릭
3. **Clear build cache & deploy** 선택
4. 배포 완료까지 대기 (2-5분)

### 5단계: 로그 확인

1. Render 대시보드 → **Logs** 탭
2. 다음 메시지 확인:
   - ✅ `✅ Prisma Client initialized successfully` → 정상
   - ❌ `❌ Failed to initialize Prisma Client` → DATABASE_URL 문제
   - ❌ `DATABASE_URL: Not set` → 환경 변수 미설정

## 🔍 문제 진단

### 로그에서 확인할 사항

**정상적인 경우**:
```
✅ Prisma Client initialized successfully
🎾 Club Attendance Server running on port 3001
```

**문제가 있는 경우**:
```
❌ Failed to initialize Prisma Client: ...
DATABASE_URL: Not set
```

또는
```
Can't reach database server at ...
Please make sure your database server is running at ...
```

### API 테스트

```bash
# Health check
curl https://tennis-club-server.onrender.com/api/health

# 사용자 목록 (에러 확인)
curl https://tennis-club-server.onrender.com/api/users
```

## 🐛 일반적인 문제

### 문제 1: "DATABASE_URL: Not set"

**원인**: 환경 변수가 설정되지 않음

**해결**: Render Environment 탭에서 DATABASE_URL 추가

### 문제 2: "Can't reach database server"

**원인**: 
- 잘못된 엔드포인트
- 네트워크 문제
- Supabase 서버 다운

**해결**:
1. Supabase 대시보드에서 연결 문자열 재확인
2. 올바른 엔드포인트 사용 (`pooler.supabase.com`)
3. Supabase 서버 상태 확인

### 문제 3: "Authentication failed"

**원인**: 비밀번호가 틀림

**해결**:
1. Supabase 대시보드에서 비밀번호 확인
2. DATABASE_URL의 비밀번호 부분 업데이트
3. URL 인코딩 확인 (특수문자는 %로 인코딩)

## ✅ 확인 체크리스트

- [ ] Render Environment에 DATABASE_URL이 설정되어 있는지
- [ ] DATABASE_URL 형식이 올바른지
- [ ] Supabase 연결 문자열과 일치하는지
- [ ] 서버가 재시작되었는지
- [ ] 로그에 "Prisma Client initialized successfully" 메시지가 있는지
- [ ] Health check API가 정상 응답하는지

## 📝 참고사항

### DATABASE_URL 형식

**Transaction Mode (권장)**:
```
postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
```

**Session Mode**:
```
postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 현재 프로젝트 값

- project-ref: `tzulmmiudjcoghipoynq`
- password: `rjgkqeh12dlfdl`
- 전체 URL: `postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15`

