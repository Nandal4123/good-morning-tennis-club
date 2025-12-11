# 월별 통계 API 오류 해결 가이드

## 🔴 오류 메시지
```
API 에러: Failed to fetch users with monthly stats
```

## 🔍 문제 진단

### 1. API 상태 확인
```bash
curl https://tennis-club-server.onrender.com/api/users/with-monthly-stats?year=2025&month=12
```

### 2. 가능한 원인

#### 원인 1: 연결 풀 제한
**증상**: `MaxClientsInSessionMode: max clients reached`

**해결**:
- Render 서버 재시작
- DATABASE_URL이 Transaction Mode로 설정되어 있는지 확인

#### 원인 2: 데이터베이스 연결 실패
**증상**: `Can't reach database server` 또는 `Authentication failed`

**해결**:
- DATABASE_URL 환경 변수 확인
- Supabase 연결 정보 재확인

#### 원인 3: 코드 오류
**증상**: 서버 로그에 JavaScript 오류

**해결**:
- Render 서버 로그 확인
- 최신 코드가 배포되었는지 확인

## ✅ 해결 방법

### 1단계: Render 서버 로그 확인

1. Render 대시보드 접속
2. `tennis-club-server` 서비스 선택
3. **Logs** 탭 클릭
4. 최근 에러 메시지 확인:
   - `❌ Error fetching users with monthly stats:`
   - `Error name:`
   - `Error message:`

### 2단계: DATABASE_URL 확인

Render Environment 탭에서:
```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
```

### 3단계: 서버 재시작

1. Manual Deploy → Clear build cache & deploy
2. 배포 완료까지 대기 (2-5분)

### 4단계: API 재테스트

```bash
curl https://tennis-club-server.onrender.com/api/users/with-monthly-stats?year=2025&month=12
```

**예상 응답**:
```json
{
  "year": 2025,
  "month": 12,
  "users": [...]
}
```

## 🔧 개선 사항

### 에러 처리 개선
- ✅ 상세한 에러 로깅 추가
- ✅ 에러 타입 및 메시지 반환
- ✅ 데이터베이스 연결 오류 감지
- ✅ 사용자 친화적인 제안 메시지

### 다음 단계
1. Render 서버 재시작
2. API 재테스트
3. 브라우저에서 확인

## 📝 참고사항

### API 엔드포인트
```
GET /api/users/with-monthly-stats?year=2025&month=12
```

### 필수 파라미터
- `year`: 년도 (예: 2025)
- `month`: 월 (1-12)

### 응답 형식
```json
{
  "year": 2025,
  "month": 12,
  "users": [
    {
      "id": "...",
      "name": "...",
      "stats": {
        "totalAttendance": 7,
        "totalMatches": 7,
        "wins": 4,
        "winRate": 57
      }
    }
  ]
}
```

