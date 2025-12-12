# 데이터베이스 연결 풀 초기화 가이드

## 🔴 현재 상황

`MaxClientsInSessionMode: max clients reached` 오류가 계속 발생하고 있습니다.

## 📊 원인

Supabase Transaction Mode의 연결 풀이 이미 가득 찬 상태입니다.

**가능한 원인:**
1. 서버가 실행 중이어서 연결을 사용 중
2. 다른 스크립트가 실행 중
3. 이전 연결이 제대로 해제되지 않음
4. Supabase 연결 풀 제한 (1-2개)에 도달

## ✅ 해결 방법

### 1단계: 모든 실행 중인 프로세스 종료

```bash
# 포트 5001 사용 중인 프로세스 종료
lsof -ti:5001 | xargs kill -9

# 또는 모든 node 프로세스 확인
ps aux | grep node
```

### 2단계: Supabase 연결 풀 초기화 대기

**중요:** Supabase Transaction Mode의 연결 풀은 자동으로 해제되지만, 최대 5-10분 정도 걸릴 수 있습니다.

**대기 시간:**
- 최소 5분
- 권장 10분

### 3단계: 연결 풀 상태 확인

Supabase 대시보드에서:
1. 프로젝트 선택
2. Database → Connection Pooling
3. 활성 연결 수 확인
4. 연결이 0개가 될 때까지 대기

### 4단계: 다시 테스트

연결 풀이 초기화된 후:
```bash
cd server
node scripts/test-connection.js
```

---

## 🔧 코드 레벨 최적화 (이미 완료)

✅ Prisma Client 자동 최적화 (connection_limit=1)
✅ 모든 스크립트 통합 유틸리티 사용
✅ 연결 해제 로직 확인

**코드는 이미 최적화되어 있습니다.**

---

## ⚠️ 주의사항

1. **한 번에 하나만 실행**
   - 서버 실행 중에는 스크립트 실행 금지
   - 스크립트 실행 중에는 다른 작업 금지

2. **연결 해제 확인**
   - 모든 스크립트가 `$disconnect()` 호출 확인됨
   - 서버 종료 시 자동 해제

3. **Supabase 연결 풀 제한**
   - Transaction Mode는 최대 1-2개 연결만 허용
   - connection_limit=1로 설정해도 내부적으로 추가 연결 시도 가능

---

## 🎯 권장 작업 순서

1. **모든 프로세스 종료**
   ```bash
   # 서버 종료
   # 모든 스크립트 종료
   ```

2. **5-10분 대기**
   - Supabase 연결 풀 초기화 대기

3. **서버만 실행**
   ```bash
   cd server
   pnpm run dev
   ```

4. **API 테스트**
   - 브라우저에서 API 호출 테스트

5. **스크립트 실행 (서버 종료 후)**
   ```bash
   # 서버 종료 후
   node scripts/test-connection.js
   ```

---

## 📝 요약

**문제:**
- Supabase 연결 풀이 가득 참
- 여러 연결이 동시에 사용 중

**해결:**
- 모든 프로세스 종료
- 5-10분 대기 (연결 풀 초기화)
- 한 번에 하나만 실행

**코드:**
- ✅ 이미 최적화 완료
- ✅ connection_limit=1 설정
- ✅ 연결 해제 로직 확인

**결과:**
- 연결 풀이 초기화되면 정상 작동
- 코드는 이미 최적화되어 있음

