# 데이터베이스 연결 불안정 문제 분석

## 🔴 현재 문제

데이터베이스 연결이 안정적이지 못한 상황입니다.

## 📊 원인 분석

### 1. **Supabase Transaction Mode 연결 풀 제한**

현재 사용 중인 연결:
```
postgresql://...@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**문제점:**
- Supabase Transaction Mode (pooler)는 **연결 풀 제한이 매우 낮음** (보통 1-2개)
- Prisma는 기본적으로 여러 연결을 생성하려고 시도
- 동시에 여러 쿼리나 스크립트가 실행되면 연결 풀 제한 초과

### 2. **현재 DATABASE_URL 설정**

```bash
DATABASE_URL="postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

**문제점:**
- `connection_limit` 파라미터가 없음
- `pgbouncer=true` 파라미터가 없음
- Prisma가 기본값(무제한)으로 연결을 시도

### 3. **Prisma Client 설정**

현재 코드:
```javascript
prisma = new PrismaClient({
  log: [...],
  // connection_limit 설정 없음
});
```

**문제점:**
- Prisma Client에 명시적인 연결 제한이 없음
- 여러 스크립트가 동시에 실행되면 연결 풀 초과

---

## ✅ 해결 방법

### 방법 1: DATABASE_URL에 파라미터 추가 (권장)

**로컬 개발 환경 (.env):**
```bash
DATABASE_URL="postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Render 환경 변수:**
```
DATABASE_URL=postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**효과:**
- `pgbouncer=true`: Transaction Mode 사용 명시
- `connection_limit=1`: Prisma가 최대 1개 연결만 사용
- 연결 풀 제한 초과 방지

### 방법 2: Prisma Client에 명시적 설정

`server/src/index.js` 수정:
```javascript
prisma = new PrismaClient({
  log: [...],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true&connection_limit=1"
    }
  }
});
```

**주의:** DATABASE_URL에 이미 파라미터가 있으면 중복될 수 있음

### 방법 3: 스크립트 실행 시 연결 관리

스크립트 실행 후 즉시 연결 해제:
```javascript
// 스크립트 끝에 항상 추가
await prisma.$disconnect();
```

---

## 🎯 권장 해결 순서

1. **로컬 .env 파일 수정**
   - `connection_limit=1` 추가
   - `pgbouncer=true` 추가

2. **Render 환경 변수 수정**
   - Render 대시보드에서 DATABASE_URL 업데이트
   - 동일한 파라미터 추가

3. **서버 재시작**
   - 변경사항 적용

4. **테스트**
   - API 호출 테스트
   - 스크립트 실행 테스트

---

## ⚠️ 주의사항

1. **connection_limit=1의 의미**
   - Prisma가 최대 1개 연결만 사용
   - 여러 쿼리는 순차적으로 실행됨
   - 성능은 약간 느려질 수 있지만 안정성 확보

2. **스크립트 실행 시**
   - 한 번에 하나의 스크립트만 실행
   - 실행 후 반드시 `$disconnect()` 호출

3. **배포 환경**
   - Render에서 DATABASE_URL이 올바르게 설정되어 있는지 확인
   - 환경 변수 업데이트 후 서버 재배포 필요

---

## 📝 요약

**문제:**
- Supabase Transaction Mode 연결 풀 제한 (1-2개)
- Prisma가 여러 연결 시도
- connection_limit 설정 없음

**해결:**
- DATABASE_URL에 `?pgbouncer=true&connection_limit=1` 추가
- Prisma Client가 1개 연결만 사용하도록 제한
- 연결 풀 제한 초과 방지

**결과:**
- 연결 안정성 향상
- MaxClientsInSessionMode 오류 방지
- 다만 쿼리는 순차 실행 (약간 느려질 수 있음)

