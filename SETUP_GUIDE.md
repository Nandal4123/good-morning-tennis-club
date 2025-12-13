# 🎾 테니스 클럽 출석 관리 앱 설정 가이드

다른 클럽이 이 앱을 사용하기 위한 완전한 설정 가이드를 제공합니다.

---

## 📋 목차

1. [필수 요구사항](#필수-요구사항)
2. [1단계: 저장소 클론](#1단계-저장소-클론)
3. [2단계: 데이터베이스 설정](#2단계-데이터베이스-설정)
4. [3단계: 환경 변수 설정](#3단계-환경-변수-설정)
5. [4단계: 로컬 개발 환경 설정](#4단계-로컬-개발-환경-설정)
6. [5단계: 배포 설정](#5단계-배포-설정)
7. [6단계: 초기 관리자 계정 생성](#6단계-초기-관리자-계정-생성)
8. [문제 해결](#문제-해결)

---

## 필수 요구사항

### 필요한 계정 및 서비스

1. **GitHub 계정** (코드 저장소)
2. **Supabase 계정** (데이터베이스)
   - 무료 플랜으로 시작 가능
   - PostgreSQL 데이터베이스 제공
3. **Render 계정** (백엔드 서버)
   - 무료 플랜 또는 유료 플랜
   - Node.js 서버 호스팅
4. **Vercel 계정** (프론트엔드)
   - 무료 플랜으로 시작 가능
   - React 앱 호스팅

### 필요한 기술 지식

- 기본적인 Git 사용법
- 터미널/명령줄 사용법
- 환경 변수 설정 방법

---

## 1단계: 저장소 클론

### 옵션 1: GitHub에서 Fork (권장)

1. GitHub에서 이 저장소를 Fork합니다
2. Fork한 저장소를 로컬로 클론합니다:
   ```bash
   git clone https://github.com/your-username/good-morning-tennis-club.git
   cd good-morning-tennis-club
   ```

### 옵션 2: 직접 다운로드

1. GitHub에서 ZIP 파일로 다운로드
2. 압축 해제 후 프로젝트 폴더로 이동

---

## 2단계: 데이터베이스 설정

### Supabase 프로젝트 생성

1. **Supabase 가입 및 로그인**
   - https://supabase.com 접속
   - GitHub 계정으로 로그인 (권장)

2. **새 프로젝트 생성**
   - "New Project" 클릭
   - 프로젝트 이름 입력 (예: "my-tennis-club")
   - 데이터베이스 비밀번호 설정 (안전하게 저장!)
   - 리전 선택 (가까운 지역 권장)
   - "Create new project" 클릭

3. **연결 정보 확인**
   - 프로젝트 대시보드 → Settings → Database
   - "Connection string" 섹션에서 정보 확인
   - **Transaction Mode** 연결 문자열 복사
     ```
     postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
     ```

### 데이터베이스 스키마 적용

1. **Prisma 스키마 확인**
   - `server/prisma/schema.prisma` 파일 확인

2. **데이터베이스 마이그레이션 실행**
   ```bash
   cd server
   pnpm install
   pnpm run db:push
   ```

---

## 3단계: 환경 변수 설정

### 서버 환경 변수 (`server/.env`)

1. `server/.env` 파일 생성:
   ```bash
   cd server
   cp .env.example .env
   ```

2. `.env` 파일 편집:
   ```env
   # 데이터베이스 연결 (Supabase Transaction Mode)
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&connect_timeout=15"
   
   # 서버 포트
   PORT=5001
   
   # 환경
   NODE_ENV=development
   
   # 클라이언트 URL (로컬 개발)
   CLIENT_URL=http://localhost:5173
   ```

   **중요:**
   - `[project-ref]`: Supabase 프로젝트 참조 ID
   - `[password]`: Supabase 데이터베이스 비밀번호
   - `connection_limit=1` 필수 (Supabase Transaction Mode 제한)

### 클라이언트 환경 변수 (`client/.env.local`)

1. `client/.env.local` 파일 생성:
   ```bash
   cd client
   touch .env.local
   ```

2. `.env.local` 파일 편집:
   ```env
   # API 서버 URL (로컬 개발 시 자동으로 localhost 사용)
   # 프로덕션 배포 시 Render 서버 URL로 변경
   VITE_API_URL=https://your-server.onrender.com/api
   ```

---

## 4단계: 로컬 개발 환경 설정

### 의존성 설치

1. **서버 의존성 설치:**
   ```bash
   cd server
   pnpm install
   ```

2. **클라이언트 의존성 설치:**
   ```bash
   cd client
   pnpm install
   ```

### 개발 서버 실행

1. **서버 실행** (터미널 1):
   ```bash
   cd server
   pnpm run dev
   ```
   - 서버가 `http://localhost:5001`에서 실행됩니다

2. **클라이언트 실행** (터미널 2):
   ```bash
   cd client
   pnpm run dev
   ```
   - 클라이언트가 `http://localhost:5173`에서 실행됩니다

3. **브라우저에서 확인:**
   - http://localhost:5173 접속
   - 앱이 정상적으로 로드되는지 확인

---

## 5단계: 배포 설정

### 백엔드 배포 (Render)

1. **Render 가입 및 로그인**
   - https://render.com 접속
   - GitHub 계정으로 로그인

2. **새 Web Service 생성**
   - "New +" → "Web Service" 클릭
   - GitHub 저장소 연결
   - 설정:
     - **Name**: `your-club-server`
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `pnpm install && pnpm run db:push`
     - **Start Command**: `pnpm run dev`
     - **Plan**: Free 또는 Paid (권장)

3. **환경 변수 설정**
   - Render 대시보드 → Environment
   - 다음 변수 추가:
     ```
     DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&connect_timeout=15
     NODE_ENV=production
     PORT=5001
     CLIENT_URL=https://your-app.vercel.app
     ```

4. **배포 확인**
   - 배포 완료 후 서버 URL 확인 (예: `https://your-club-server.onrender.com`)
   - Health Check: `https://your-club-server.onrender.com/api/health`

### 프론트엔드 배포 (Vercel)

1. **Vercel 가입 및 로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택
   - 설정:
     - **Framework Preset**: Vite
     - **Root Directory**: `client`
     - **Build Command**: `pnpm run build`
     - **Output Directory**: `dist`

3. **환경 변수 설정**
   - Vercel 대시보드 → Settings → Environment Variables
   - 다음 변수 추가:
     ```
     VITE_API_URL=https://your-club-server.onrender.com/api
     ```

4. **배포 확인**
   - 배포 완료 후 앱 URL 확인 (예: `https://your-app.vercel.app`)
   - 앱이 정상적으로 작동하는지 확인

---

## 6단계: 초기 관리자 계정 생성

### 방법 1: 앱에서 직접 생성 (권장)

1. 배포된 앱에 접속
2. "회원가입" 또는 "Sign Up" 클릭
3. 관리자 이메일로 계정 생성
4. 데이터베이스에서 직접 권한 변경:
   ```sql
   -- Supabase SQL Editor에서 실행
   UPDATE users 
   SET role = 'ADMIN' 
   WHERE email = 'your-admin@email.com';
   ```

### 방법 2: 데이터베이스에서 직접 생성

1. Supabase 대시보드 → SQL Editor
2. 다음 SQL 실행:
   ```sql
   INSERT INTO users (email, name, role, "tennisLevel", "languagePref")
   VALUES (
     'admin@yourclub.com',
     '관리자',
     'ADMIN',
     'NTRP_3_0',
     'ko'
   );
   ```

---

## 문제 해결

### 데이터베이스 연결 오류

**증상:** `MaxClientsInSessionMode: max clients reached`

**해결:**
1. `DATABASE_URL`에 `connection_limit=1` 파라미터 확인
2. `pgbouncer=true` 파라미터 확인
3. Supabase Transaction Mode 사용 확인

### API 호출 실패

**증상:** 프론트엔드에서 데이터가 표시되지 않음

**해결:**
1. `VITE_API_URL` 환경 변수 확인
2. Render 서버가 실행 중인지 확인
3. CORS 설정 확인

### 배포 실패

**증상:** Render 또는 Vercel 배포 실패

**해결:**
1. 빌드 로그 확인
2. 환경 변수 설정 확인
3. `package.json` 스크립트 확인

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 마이그레이션 실행 완료
- [ ] 서버 `.env` 파일 설정 완료
- [ ] 클라이언트 `.env.local` 파일 설정 완료
- [ ] 로컬에서 정상 작동 확인
- [ ] Render 서버 배포 완료
- [ ] Vercel 프론트엔드 배포 완료
- [ ] 환경 변수 설정 완료
- [ ] 관리자 계정 생성 완료
- [ ] 배포된 앱 정상 작동 확인

---

## 💡 추가 팁

### 성능 최적화

- Render 유료 플랜 사용 권장 (더 빠른 응답)
- Supabase 무료 플랜으로 시작 가능
- 데이터가 많아지면 Supabase 유료 플랜 고려

### 보안

- 데이터베이스 비밀번호는 안전하게 보관
- 환경 변수는 절대 Git에 커밋하지 않기
- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인

### 커스터마이징

- 클럽 이름 변경: `client/src/` 폴더의 텍스트 수정
- 색상 테마 변경: `client/src/index.css` 수정
- 로고 변경: `client/public/` 폴더에 이미지 추가

---

## 🆘 도움이 필요하신가요?

문제가 발생하면:
1. 이 가이드의 "문제 해결" 섹션 확인
2. GitHub Issues에 질문 등록
3. 로그 파일 확인 (서버 및 클라이언트)

---

**축하합니다! 🎉 이제 여러분의 테니스 클럽 출석 관리 앱이 준비되었습니다!**

