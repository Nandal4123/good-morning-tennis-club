# 🔍 Vercel 환경변수 확인 가이드

Vercel에서 `VITE_API_URL` 환경변수를 확인하고 설정하는 방법입니다.

---

## 📋 방법 1: Vercel 대시보드에서 확인 (가장 확실)

### 1단계: Vercel 대시보드 접속

1. **브라우저에서 접속:**
   ```
   https://vercel.com/dashboard
   ```

2. **로그인** (GitHub 계정으로 로그인)

### 2단계: 프로젝트 선택

1. **프로젝트 목록에서 선택:**
   - `good-morning-tennis-club` 또는
   - `good-morning-tennis-club-fn73` (프로젝트 이름 확인)

### 3단계: Settings 메뉴

1. **프로젝트 페이지에서:**
   - 상단 메뉴에서 **"Settings"** 클릭
   - 또는 왼쪽 사이드바에서 **"Settings"** 클릭

### 4단계: Environment Variables 확인

1. **Settings 페이지에서:**
   - 왼쪽 메뉴에서 **"Environment Variables"** 클릭
   - 또는 스크롤하여 **"Environment Variables"** 섹션 찾기

2. **환경변수 목록 확인:**
   - `VITE_API_URL` 변수가 있는지 확인
   - 값이 무엇인지 확인

### 5단계: 값 확인

**올바른 값:**
```
https://good-morning-tennis-club-v2.onrender.com/api
```

**잘못된 값 또는 없음:**
- 값이 없음 → 추가 필요
- `https://tennis-club-server.onrender.com/api` → 구버전 서버 (수정 필요)
- 다른 값 → 확인 필요

---

## 📋 방법 2: 브라우저 콘솔에서 확인 (빠른 확인)

### 1단계: 앱 접속

1. **브라우저에서 접속:**
   ```
   https://good-morning-tennis-club.vercel.app/?owner=1
   ```

### 2단계: 개발자 도구 열기

1. **F12 키 누르기** 또는
2. **우클릭 → "검사"** 또는
3. **Mac: Cmd + Option + I**

### 3단계: Console 탭 확인

1. **Console 탭 클릭**
2. **페이지 새로고침 (F5 또는 Cmd+R)**
3. **다음 메시지 찾기:**
   ```
   [API] 🚀 프로덕션 모드: API_BASE = https://???.onrender.com/api
   ```

### 4단계: 값 확인

**예시:**
```
[API] 🚀 프로덕션 모드: API_BASE = https://good-morning-tennis-club-v2.onrender.com/api
[API] ✅ 환경 변수 VITE_API_URL 사용
```
→ ✅ 정상 (환경변수 설정됨)

```
[API] 🚀 프로덕션 모드: API_BASE = https://tennis-club-server.onrender.com/api
[API] ⚠️ 환경 변수 없음, 기본 배포 서버 URL 사용
```
→ ❌ 문제 (환경변수 없음, 구버전 서버 사용)

---

## 📋 방법 3: Network 탭에서 확인 (가장 정확)

### 1단계: 개발자 도구 열기

1. **F12 키 누르기**
2. **Network 탭 클릭**

### 2단계: Owner 로그인 시도

1. **Owner 로그인 버튼 클릭**
2. **비밀번호 입력 후 로그인 시도**

### 3단계: 요청 확인

1. **Network 탭에서 `/owner/login` 요청 찾기**
2. **요청 클릭**
3. **Headers 탭에서 "Request URL" 확인**

**예시:**
```
Request URL: https://good-morning-tennis-club-v2.onrender.com/api/owner/login
```
→ ✅ 정상 (올바른 서버)

```
Request URL: https://tennis-club-server.onrender.com/api/owner/login
```
→ ❌ 문제 (구버전 서버)

---

## 🔧 환경변수 설정/수정 방법

### Vercel에서 환경변수 설정:

1. **Vercel 대시보드 → 프로젝트 → Settings**
2. **Environment Variables 클릭**
3. **"Add New" 또는 기존 변수 "Edit" 클릭**
4. **다음 정보 입력:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://good-morning-tennis-club-v2.onrender.com/api`
   - **Environment**: `Production`, `Preview`, `Development` 모두 선택 (또는 Production만)
5. **"Save" 클릭**

### 재배포:

환경변수를 변경한 후:
1. **Deployments 탭 클릭**
2. **최신 배포의 "..." 메뉴 → "Redeploy" 클릭**
3. **또는 자동으로 재배포될 때까지 대기**

---

## ✅ 체크리스트

- [ ] Vercel 대시보드 접속
- [ ] 프로젝트 선택 (`good-morning-tennis-club` 또는 `good-morning-tennis-club-fn73`)
- [ ] Settings → Environment Variables 확인
- [ ] `VITE_API_URL` 변수 존재 확인
- [ ] 값이 `https://good-morning-tennis-club-v2.onrender.com/api`인지 확인
- [ ] 브라우저 콘솔에서 API_BASE 확인
- [ ] Network 탭에서 실제 요청 URL 확인

---

## 🚨 문제 발견 시 해결

### 문제 1: 환경변수가 없음

**해결:**
1. Vercel → Settings → Environment Variables
2. "Add New" 클릭
3. Key: `VITE_API_URL`, Value: `https://good-morning-tennis-club-v2.onrender.com/api`
4. Save → 재배포

### 문제 2: 잘못된 값

**해결:**
1. Vercel → Settings → Environment Variables
2. `VITE_API_URL` 변수의 "Edit" 클릭
3. Value를 `https://good-morning-tennis-club-v2.onrender.com/api`로 수정
4. Save → 재배포

### 문제 3: 재배포 후에도 반영 안 됨

**해결:**
1. Vercel → Deployments
2. 최신 배포의 "..." → "Redeploy" 클릭
3. 또는 "Clear Cache & Redeploy" 선택

---

## 💡 빠른 확인 방법

**가장 빠른 방법: 브라우저 콘솔 확인**

1. `https://good-morning-tennis-club.vercel.app/?owner=1` 접속
2. F12 → Console 탭
3. 페이지 새로고침
4. `[API] 🚀 프로덕션 모드: API_BASE = ...` 메시지 확인

이 메시지만으로도 환경변수 설정 여부를 바로 확인할 수 있습니다!


