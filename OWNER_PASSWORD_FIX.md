# 🔧 Owner 비밀번호 문제 해결 (`owner!-2025`)

`owner!-2025`로 시작하는 비밀번호가 맞지 않는 문제 해결 방법입니다.

---

## 🔍 확인 사항

### 1. 비밀번호 정확성 확인

**가능한 비밀번호:**
- `owner!-2025` (소문자)
- `Owner!-2025` (대문자 O)
- `owner!-2025` + 추가 문자 (예: `owner!-2025abc`)
- 다른 변형

**중요:** 코드는 **정확히 일치**해야 합니다. 대소문자, 특수문자 모두 구분됩니다.

### 2. Render 환경변수 확인

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - 서비스: `good-morning-tennis-club-v2`

2. **Environment 탭 클릭**

3. **`OWNER_PASSWORD` 변수 확인**
   - 변수가 존재하는가?
   - 값이 정확히 `owner!-2025` (또는 전체 비밀번호)로 설정되어 있는가?
   - 값에 추가 문자가 있는가? (예: `owner!-2025` 뒤에 공백이나 다른 문자)

### 3. Manual Deploy 확인 (가장 중요!)

**환경변수를 변경했다면 반드시 Manual Deploy를 실행해야 합니다!**

1. Render 대시보드 → `good-morning-tennis-club-v2` 서비스
2. **Manual Deploy** 버튼 클릭
3. 배포 완료 대기 (약 2-3분)
4. 로그에서 `==> Your service is live 🎉` 확인

---

## 🛠️ 해결 방법

### 방법 1: 비밀번호 재설정 (권장)

1. **Render 대시보드 → Environment Variables**
2. **`OWNER_PASSWORD` 값 확인/수정**
   - 현재 값이 정확히 무엇인지 확인
   - 만약 값이 다르다면 → `owner!-2025` (또는 전체 비밀번호)로 설정
3. **Save Changes 클릭**
4. **Manual Deploy 실행** (필수!)
5. **배포 완료 후 로그인 테스트**

### 방법 2: 간단한 값으로 테스트

비밀번호 문제를 격리하기 위해:

1. **Render → Environment Variables**
2. **`OWNER_PASSWORD` = `test123` (임시)**
3. **Save Changes**
4. **Manual Deploy 실행**
5. **배포 완료 후 `test123`으로 로그인 시도**

**결과:**
- ✅ `test123`으로 로그인 성공 → 원래 비밀번호 값이 다름
- ❌ `test123`으로도 실패 → 다른 문제 (서버 연결 등)

### 방법 3: 비밀번호 전체 확인

`owner!-2025`가 **시작 부분**이라면, 전체 비밀번호를 확인해야 합니다.

**확인 방법:**
1. Render UI에서는 보안상 전체 값을 보여주지 않음
2. 비밀번호를 잊었다면 → 새로 설정해야 함

**새 비밀번호 설정:**
1. Render → Environment Variables
2. `OWNER_PASSWORD` = `owner!-2025` (또는 원하는 전체 비밀번호)
3. Save Changes
4. Manual Deploy 실행

---

## 🔐 비밀번호 입력 시 주의사항

### 1. 특수문자 정확히 입력
- `owner!-2025`에서:
  - `!` (느낌표)
  - `-` (하이픈)
  - 모두 정확히 입력

### 2. 대소문자 확인
- `owner!-2025` (소문자 o)
- `Owner!-2025` (대문자 O) ← 다름!

### 3. 공백 확인
- `owner!-2025` (정확)
- ` owner!-2025 ` (앞뒤 공백) ← 다름!
- `owner!-2025` (중간 공백) ← 다름!

### 4. 직접 타이핑 권장
- 복사/붙여넣기 시 보이지 않는 문자가 포함될 수 있음
- 가능하면 직접 타이핑

---

## 🧪 단계별 테스트

### Step 1: 간단한 값으로 테스트

```
1. Render → Environment Variables
2. OWNER_PASSWORD = test123
3. Save Changes
4. Manual Deploy
5. 배포 완료 대기
6. test123으로 로그인 시도
```

**예상 결과:**
- 성공 → 원래 비밀번호 값 문제
- 실패 → 다른 문제

### Step 2: 원래 비밀번호로 복원

```
1. OWNER_PASSWORD = owner!-2025 (또는 전체 비밀번호)
2. Save Changes
3. Manual Deploy
4. 배포 완료 후 로그인 테스트
```

### Step 3: 로그 확인

Render 서버 로그에서 확인:
1. Render 대시보드 → Logs 탭
2. Owner 로그인 시도 시 에러 메시지 확인
3. `Owner login error:` 메시지 확인

---

## 📋 체크리스트

- [ ] Render에서 `OWNER_PASSWORD` 변수가 존재하는가?
- [ ] 값이 정확히 `owner!-2025` (또는 전체 비밀번호)로 설정되어 있는가?
- [ ] 환경변수 변경 후 **Manual Deploy**를 실행했는가? (가장 중요!)
- [ ] 배포가 완료되었는가? (로그에서 "live" 확인)
- [ ] 입력할 때 `owner!-2025`를 정확히 입력했는가?
  - [ ] 소문자 `owner` (대문자 O 아님)
  - [ ] 느낌표 `!`
  - [ ] 하이픈 `-`
  - [ ] 숫자 `2025`
  - [ ] 앞뒤 공백 없음
- [ ] `OWNER_TOKEN_SECRET`도 설정되어 있는가?

---

## 💡 추가 팁

### 비밀번호가 `owner!-2025`로 시작한다면

전체 비밀번호가 더 길 수 있습니다:
- `owner!-2025`
- `owner!-2025abc`
- `owner!-2025!@#`
- 등등

**해결:**
- 전체 비밀번호를 정확히 기억하는지 확인
- 기억나지 않으면 → 새로 설정

### 새 비밀번호 설정 권장

기억하기 쉽고 안전한 비밀번호:
- `owner!-2025` (현재 사용 중이라면)
- `Owner@2025!` (대문자 포함)
- `tennis-owner-2025!` (더 긴 버전)

---

## 🚨 즉시 해결 방법

**가장 빠른 해결:**

1. **Render 대시보드 접속**
2. **`good-morning-tennis-club-v2` 서비스 선택**
3. **Environment 탭 → `OWNER_PASSWORD` 확인**
4. **값을 `owner!-2025` (또는 전체 비밀번호)로 정확히 설정**
5. **Save Changes**
6. **Manual Deploy 버튼 클릭** (중요!)
7. **배포 완료 대기 (2-3분)**
8. **로그인 시도**

**여전히 안 되면:**
- `test123`으로 임시 테스트
- Render 서버 로그 확인
- 브라우저 개발자 도구(F12) → Network 탭에서 API 응답 확인

