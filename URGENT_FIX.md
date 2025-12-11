# 🚨 긴급 수정: 연결 풀 제한 문제 해결

## 현재 문제
모든 데이터베이스 API가 실패하고 있습니다:
```
MaxClientsInSessionMode: max clients reached
```

## ✅ 즉시 해결 방법

### Render 서버 DATABASE_URL 변경 (필수)

**현재 문제**: Session Mode 사용 중 (연결 제한 15개)

**해결**: Transaction Mode로 변경

### 단계별 가이드

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - `tennis-club-server` 서비스 선택

2. **Environment 탭 클릭**

3. **DATABASE_URL 찾기 → Edit 클릭**

4. **다음 값으로 변경**:
   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
   ```

5. **Save Changes 클릭**

6. **Manual Deploy → Clear build cache & deploy**

7. **배포 완료까지 대기 (2-5분)**

## 🔍 차이점

### Session Mode (현재 - 문제 발생)
- 연결 제한: **15개**
- 빠른 연결
- **문제**: Prisma가 여러 연결을 생성하여 제한 초과

### Transaction Mode (권장 - 해결책)
- 연결 풀 사용
- 더 많은 동시 연결 가능
- `?pgbouncer=true` 파라미터 사용

## ✅ 확인 방법

배포 완료 후:

```bash
# Health Check
curl https://tennis-club-server.onrender.com/api/health

# Users API
curl https://tennis-club-server.onrender.com/api/users

# Monthly Stats API
curl https://tennis-club-server.onrender.com/api/users/with-monthly-stats?year=2025&month=12
```

**예상 결과**: 모든 API가 정상 응답

## 📝 참고사항

- DATABASE_URL에 `?pgbouncer=true&connect_timeout=15` 파라미터가 있어야 합니다
- Transaction Mode는 Session Mode보다 더 많은 연결을 허용합니다
- 변경 후 서버를 반드시 재시작해야 합니다

