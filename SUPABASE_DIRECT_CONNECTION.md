# Supabase Direct Connection 설정 가이드

## 🔴 현재 문제

`connect.supabase.com`에 연결할 수 없습니다. Supabase의 정확한 Direct Connection 형식을 확인해야 합니다.

## ✅ 해결 방법: Supabase 대시보드에서 Direct Connection String 확인

### 1단계: Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `tzulmmiudjcoghipoynq`
3. **Settings** → **Database** 클릭

### 2단계: Connection String 확인

**Database** 페이지에서 다음 섹션을 찾으세요:

#### A. Connection string 섹션

여러 연결 옵션이 표시됩니다:

1. **Session mode** (Transaction Mode)
   - `pooler.supabase.com:5432` 사용
   - `pgbouncer=true` 필요
   - 연결 제한: 1-2개

2. **Transaction mode** (동일)
   - `pooler.supabase.com:5432` 사용
   - `pgbouncer=true` 필요
   - 연결 제한: 1-2개

3. **Direct connection** ⭐ (이것을 사용해야 함)
   - 호스트명이 다를 수 있음
   - `pgbouncer` 파라미터 불필요
   - 연결 제한: 최대 100개

### 3단계: Direct Connection String 복사

**Direct connection** 섹션에서 연결 문자열을 복사하세요.

**예상 형식들:**

#### 형식 1: connect.psdb.cloud (PlanetScale 스타일)
```
postgresql://postgres.tzulmmiudjcoghipoynq:[PASSWORD]@aws-1-ap-northeast-2.connect.psdb.cloud:5432/postgres?sslmode=require
```

#### 형식 2: connect.supabase.com
```
postgresql://postgres.tzulmmiudjcoghipoynq:[PASSWORD]@aws-1-ap-northeast-2.connect.supabase.com:5432/postgres
```

#### 형식 3: 다른 호스트명
```
postgresql://postgres.tzulmmiudjcoghipoynq:[PASSWORD]@[HOST]:5432/postgres
```

### 4단계: Render Environment 업데이트

1. Render 대시보드 → 서비스 선택 → **Environment** 탭
2. `DATABASE_URL` 환경 변수 찾기
3. Supabase에서 복사한 **Direct Connection** 문자열로 교체
4. `[PASSWORD]`를 실제 비밀번호로 교체: `rjgkqeh12dlfdl`
5. `connection_limit=10` 파라미터 추가 (없으면)

**최종 형식 예시:**
```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@[SUPABASE_DIRECT_HOST]:5432/postgres?connection_limit=10
```

### 5단계: 저장 및 재시작

1. **Save Changes** 클릭
2. 서버 자동 재시작 대기 (1-2분)
3. API 테스트

---

## 🔍 Supabase 대시보드에서 확인할 위치

1. **Settings** → **Database**
2. **Connection string** 섹션
3. **"Direct connection"** 또는 **"Connection pooling"** 섹션에서 **"Direct"** 옵션 선택
4. 연결 문자열 복사

---

## ⚠️ 중요 사항

1. **정확한 호스트명 확인**: Supabase 대시보드에서 제공하는 정확한 호스트명을 사용해야 합니다.
2. **비밀번호 확인**: `rjgkqeh12dlfdl`이 맞는지 확인하세요.
3. **SSL 모드**: 일부 Direct Connection은 `sslmode=require`가 필요할 수 있습니다.

---

## 📝 다음 단계

1. Supabase 대시보드에서 Direct Connection string 확인
2. Render Environment에서 `DATABASE_URL` 업데이트
3. 변경 완료 후 알려주시면 API 테스트 진행

