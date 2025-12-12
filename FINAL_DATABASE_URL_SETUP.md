# 최종 DATABASE_URL 설정 가이드

## 🔴 확인된 사항

1. **Direct Connection은 IPv4 호환되지 않음**
   - Supabase 대시보드에서 "Not IPv4 compatible" 경고 표시
   - Render는 IPv4 네트워크를 사용하므로 Direct Connection 사용 불가

2. **Session Pooler (Transaction Mode) 사용 필요**
   - IPv4 호환됨
   - 하지만 연결 제한이 매우 엄격 (1-2개)

## ✅ 최종 DATABASE_URL 설정

### Render Environment에서 설정할 값

```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15&connection_limit=1
```

**중요 파라미터:**
- `pgbouncer=true`: Transaction Mode 사용
- `connection_limit=1`: 연결 풀을 최소화하여 연결 제한 오류 방지
- `connect_timeout=15`: 연결 타임아웃 설정

## 📝 설정 방법

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - 서비스 선택: `tennis-club-server`

2. **Environment 탭 클릭**

3. **DATABASE_URL 환경 변수 찾기**

4. **값 입력:**
   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15&connection_limit=1
   ```

5. **Save Changes 클릭**

6. **서버 자동 재시작 대기** (1-2분)

## 🔧 코드 최적화 상태

현재 코드는 이미 최적화되어 있습니다:
- ✅ 순차 처리로 변경 (`getAllUsersWithMonthlyStats`, `getAllUsersWithStats`)
- ✅ `connection_limit=1` 자동 설정 (`server/src/index.js`)
- ✅ 쿼리 최적화 적용

## ⚠️ 주의사항

1. **연결 제한**: `connection_limit=1`로 설정되어 있어 한 번에 하나의 요청만 처리 가능
2. **응답 시간**: 순차 처리로 인해 응답 시간이 다소 길어질 수 있음
3. **동시 요청**: 여러 사용자가 동시에 접속하면 요청이 대기될 수 있음

## 🎯 대안 (향후 고려)

1. **Supabase IPv4 Add-on 구매**: Direct Connection 사용 가능
2. **다른 호스팅 플랫폼**: IPv6 지원하는 플랫폼 사용
3. **로컬 캐싱**: 자주 조회되는 데이터 캐싱으로 쿼리 수 감소

## ✅ 다음 단계

1. Render Environment에서 위 DATABASE_URL 설정
2. 변경 완료 후 알려주시면 API 테스트 진행


