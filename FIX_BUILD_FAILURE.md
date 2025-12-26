# 🔧 빌드 실패 해결 가이드

`ELIFECYCLE Command failed` 에러는 빌드 과정에서 실패했다는 의미입니다.

---

## 🔍 문제 원인 분석

### 현재 빌드 명령어 (`render.yaml`):

```yaml
buildCommand: corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm prisma generate && pnpm prisma db push --accept-data-loss
```

**가능한 실패 지점:**
1. `pnpm install` - 의존성 설치 실패
2. `pnpm prisma generate` - Prisma 클라이언트 생성 실패
3. `pnpm prisma db push --accept-data-loss` - 데이터베이스 스키마 적용 실패

---

## 🔍 Render 로그에서 확인할 사항

### 1단계: Render 대시보드 접속

1. https://dashboard.render.com 접속
2. "My project" → `good-morning-tennis-club-v2` 서비스 클릭
3. **Logs 탭** 클릭

### 2단계: 에러 메시지 확인

`ELIFECYCLE Command failed` 전후의 로그를 확인하세요:

**확인할 에러 메시지:**

**케이스 1: Prisma 관련 에러**
```
Error: Can't reach database server
```
→ DATABASE_URL 문제

**케이스 2: 의존성 설치 실패**
```
ERR_PNPM_NO_MATCHING_VERSION
```
→ package.json 버전 문제

**케이스 3: Prisma generate 실패**
```
Error: Prisma Client did not initialize yet
```
→ Prisma 설정 문제

**케이스 4: 데이터베이스 연결 실패**
```
P1001: Can't reach database server
```
→ DATABASE_URL 또는 네트워크 문제

---

## 🛠️ 해결 방법

### 방법 1: Clear Build Cache & Redeploy (가장 빠름)

1. **Render 대시보드 → `good-morning-tennis-club-v2` 서비스**
2. **Manual Deploy 버튼 클릭**
3. **"Clear build cache & deploy" 선택**
4. **배포 완료 대기 (2-5분)**

### 방법 2: DATABASE_URL 확인

1. **Render 대시보드 → Environment 탭**
2. **`DATABASE_URL` 변수 확인:**
   - 값이 설정되어 있는가?
   - 형식이 올바른가?
   - `pgbouncer=true&connection_limit=1` 포함되어 있는가?

**올바른 형식:**
```
postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&connect_timeout=15
```

### 방법 3: 빌드 명령어 단순화 (임시)

빌드 명령어를 단순화하여 문제를 격리:

1. **Render 대시보드 → Settings 탭**
2. **Build Command 수정:**
   ```
   corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm prisma generate
   ```
   (마지막 `pnpm prisma db push --accept-data-loss` 제거)

3. **Save Changes**
4. **Manual Deploy 실행**

**참고:** `prisma db push`는 스키마 변경 시에만 필요합니다. 이미 스키마가 적용되어 있다면 제거해도 됩니다.

---

## 🔍 단계별 디버깅

### Step 1: 빌드 로그 전체 확인

Render 로그에서 `ELIFECYCLE Command failed` **이전**의 모든 로그를 확인:
- 어떤 명령어가 실행되었는가?
- 어디서 실패했는가?
- 에러 메시지가 무엇인가?

### Step 2: 에러 메시지 분석

**일반적인 에러:**

1. **"Can't reach database server"**
   - DATABASE_URL 문제
   - 해결: DATABASE_URL 재설정

2. **"Prisma Client did not initialize"**
   - Prisma generate 실패
   - 해결: Clear build cache & redeploy

3. **"ERR_PNPM_NO_MATCHING_VERSION"**
   - package.json 버전 문제
   - 해결: pnpm-lock.yaml 확인

### Step 3: 단계별 빌드 테스트

빌드 명령어를 나눠서 테스트:

**원래 명령어:**
```bash
corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm prisma generate && pnpm prisma db push --accept-data-loss
```

**단계별 테스트:**

1. **의존성만 설치:**
   ```
   corepack enable && pnpm install --frozen-lockfile --prod=false
   ```

2. **Prisma generate만:**
   ```
   pnpm prisma generate
   ```

3. **DB push만:**
   ```
   pnpm prisma db push --accept-data-loss
   ```

각 단계에서 어디서 실패하는지 확인

---

## ✅ 빠른 해결 방법

### 가장 빠른 방법: Clear Build Cache & Redeploy

1. **Render 대시보드 → `good-morning-tennis-club-v2` 서비스**
2. **Manual Deploy 클릭**
3. **"Clear build cache & deploy" 선택** (중요!)
4. **배포 완료 대기**
5. **로그에서 "Your service is live 🎉" 확인**

---

## 📋 체크리스트

- [ ] Render 로그에서 `ELIFECYCLE Command failed` 이전의 에러 메시지 확인
- [ ] DATABASE_URL 환경변수 확인
- [ ] Clear Build Cache & Redeploy 실행
- [ ] 배포 완료 후 "Your service is live 🎉" 확인
- [ ] Owner 로그인 시도 후 `[Owner Login]` 로그 확인

---

## 💡 중요

**빌드가 실패하면 서버가 시작되지 않습니다!**

따라서:
1. 먼저 빌드 실패를 해결해야 함
2. 빌드 성공 후 서버가 정상 실행됨
3. 그 후에 Owner 로그인 테스트 가능

---

**Render 로그에서 `ELIFECYCLE Command failed` 이전의 에러 메시지를 확인하고 알려주시면 정확한 원인을 파악할 수 있습니다!**




