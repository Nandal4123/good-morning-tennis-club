# 연결 풀 제한 문제 최종 해결 방안

## 🔴 현재 문제

Supabase Transaction Mode (pgbouncer)를 사용 중이며, 연결 풀 제한이 매우 엄격합니다:
- **Transaction Mode**: 최대 1-2개 연결만 허용
- **여러 요청 동시 처리 불가능**
- `MaxClientsInSessionMode: max clients reached` 오류 지속 발생

## ✅ 해결 방안: Supabase Direct Connection으로 변경

### 옵션 1: Direct Connection 사용 (권장)

**장점:**
- 연결 제한이 훨씬 높음 (최대 100개)
- 여러 요청을 동시에 처리 가능
- Transaction Mode의 제한 없음

**단점:**
- 연결이 직접 데이터베이스에 연결되므로 연결 수가 많아질 수 있음
- 하지만 Prisma의 connection_limit으로 제어 가능

### 옵션 2: 현재 설정 유지 + 요청 제한

**장점:**
- 설정 변경 불필요
- Transaction Mode의 이점 유지

**단점:**
- 요청을 순차적으로 처리해야 함
- 성능 저하 가능

---

## 🚀 Direct Connection으로 변경하기

### 1단계: Supabase에서 Connection String 확인

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택: `tzulmmiudjcoghipoynq`
3. **Settings** → **Database** 클릭
4. **Connection string** 섹션에서 **"Direct connection"** 선택
5. Connection string 복사

**Direct Connection 형식:**
```
postgresql://postgres.tzulmmiudjcoghipoynq:[PASSWORD]@aws-1-ap-northeast-2.connect.supabase.com:5432/postgres
```

**차이점:**
- Transaction Mode: `pooler.supabase.com:5432` (pgbouncer 사용)
- Direct Connection: `connect.supabase.com:5432` (직접 연결)

### 2단계: Render Environment 변수 업데이트

1. Render 대시보드 접속
2. 서비스 선택 → **Environment** 탭
3. `DATABASE_URL` 환경 변수 찾기
4. **값 수정**:
   - 기존 (Transaction Mode):
     ```
     postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15&connection_limit=2
     ```
   - 변경 (Direct Connection):
     ```
     postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.connect.supabase.com:5432/postgres?connection_limit=10
     ```
5. **Save Changes** 클릭
6. 서버 자동 재시작 대기 (1-2분)

### 3단계: 코드에서 connection_limit 조정

Direct Connection은 더 많은 연결을 허용하므로 `connection_limit`을 높일 수 있습니다:

**`server/src/index.js` 수정:**
```javascript
// Direct Connection은 더 많은 연결 허용
if (databaseUrl && !databaseUrl.includes("connection_limit")) {
  const separator = databaseUrl.includes("?") ? "&" : "?";
  optimizedUrl = `${databaseUrl}${separator}connection_limit=10&pool_timeout=10`;
  console.log("🔧 DATABASE_URL에 connection_limit=10 파라미터 추가됨 (Direct Connection)");
}
```

### 4단계: 테스트

배포 완료 후 API 테스트:
```bash
curl https://tennis-club-server.onrender.com/api/users/1/stats
curl https://tennis-club-server.onrender.com/api/users/with-monthly-stats?year=2025&month=12
```

---

## 📊 비교표

| 항목 | Transaction Mode | Direct Connection |
|------|-----------------|------------------|
| **연결 제한** | 1-2개 (매우 제한적) | 최대 100개 |
| **동시 요청 처리** | ❌ 불가능 | ✅ 가능 |
| **성능** | 느림 (순차 처리) | 빠름 (병렬 처리) |
| **연결 풀 관리** | pgbouncer 사용 | Prisma 직접 관리 |
| **권장 사용** | 단순한 앱 | 프로덕션 앱 |

---

## ⚠️ 주의사항

1. **Direct Connection 사용 시:**
   - Prisma의 `connection_limit`을 적절히 설정해야 함 (권장: 10-20)
   - 너무 많은 연결은 데이터베이스 부하 증가

2. **Transaction Mode 유지 시:**
   - 요청을 순차적으로 처리해야 함
   - API 응답 시간이 길어질 수 있음

---

## 🎯 권장 사항

**프로덕션 환경에서는 Direct Connection 사용을 권장합니다:**
- 여러 사용자가 동시에 접속할 수 있음
- API 응답 시간 개선
- 연결 풀 제한 문제 해결

---

## 📝 다음 단계

1. Supabase에서 Direct Connection string 확인
2. Render Environment에서 `DATABASE_URL` 업데이트
3. 코드에서 `connection_limit=10`으로 조정
4. 배포 및 테스트


