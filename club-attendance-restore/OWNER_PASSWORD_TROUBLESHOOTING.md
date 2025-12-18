# 🔍 Owner 비밀번호 문제 해결 가이드

Render에 설정한 `OWNER_PASSWORD`가 맞지 않는 문제를 해결하는 방법입니다.

---

## 🔎 문제 원인 분석

코드에서 비밀번호 검증 방식:

```javascript
// 입력값과 환경변수 모두 앞뒤 공백 제거
const inputPassword = (req.body?.password || "").toString().trim();
const ownerPassword = (process.env.OWNER_PASSWORD || "").toString().trim();

// 정확히 일치해야 함 (대소문자, 공백 모두 구분)
const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
```

**중요:** 비밀번호는 **정확히 일치**해야 합니다. 대소문자, 공백, 특수문자 모두 구분됩니다.

---

## ✅ 체크리스트 (순서대로 확인)

### 1단계: Render 환경변수 확인

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - 서비스 선택: `good-morning-tennis-club-v2`

2. **Environment 탭 클릭**
   - 왼쪽 메뉴에서 **Environment** 선택

3. **`OWNER_PASSWORD` 변수 확인**
   - 변수가 존재하는가?
   - 값이 설정되어 있는가? (빈 값이 아닌가?)
   - 값에 보이지 않는 문자가 있는가?

4. **값 복사**
   - Render UI에서 값을 복사할 때 주의:
     - **전체 값**을 정확히 복사
     - 앞뒤 공백이 포함되지 않도록 주의
     - 특수문자가 있는 경우 정확히 복사

### 2단계: 환경변수 값 검증

**Render UI에서 확인할 수 있는 것:**
- ✅ 변수 이름: `OWNER_PASSWORD`
- ✅ 값의 길이 (보이지 않지만)
- ❌ 실제 값 (보안상 마스킹됨)

**값을 확인하는 방법:**

1. **임시로 간단한 값으로 테스트**
   ```
   OWNER_PASSWORD = test123
   ```
   - Manual Deploy 실행
   - `test123`으로 로그인 시도
   - 성공하면 → 원래 비밀번호로 다시 변경
   - 실패하면 → 다른 문제 (서버 연결 등)

2. **값을 직접 확인하려면**
   - Render는 보안상 환경변수 값을 직접 보여주지 않음
   - 비밀번호를 잊었다면 → 새로 설정해야 함

### 3단계: Manual Deploy 확인

**중요:** 환경변수를 변경한 후 **반드시 Manual Deploy를 실행**해야 합니다!

1. **Render 대시보드 → 해당 서비스**
2. **Manual Deploy 버튼 클릭**
3. **배포 완료 대기** (약 2-3분)
4. **로그 확인:**
   - `==> Your service is live 🎉` 메시지 확인
   - 에러가 없는지 확인

### 4단계: 입력값 확인

**브라우저에서 입력할 때 주의사항:**

1. **앞뒤 공백 제거**
   - 복사/붙여넣기 시 공백이 포함될 수 있음
   - 입력 후 앞뒤 공백 확인

2. **대소문자 정확히 입력**
   - `Password123` ≠ `password123`
   - `PASSWORD123` ≠ `Password123`

3. **특수문자 정확히 입력**
   - `!@#$%` 등 특수문자가 있으면 정확히 입력

4. **보이지 않는 문자 주의**
   - 일부 텍스트 에디터에서 복사 시 보이지 않는 문자가 포함될 수 있음
   - 직접 타이핑하는 것을 권장

### 5단계: 서버 로그 확인

**Render 서버 로그에서 확인:**

1. **Render 대시보드 → Logs 탭**
2. **Owner 로그인 시도 시 로그 확인:**
   ```
   Owner login error: ...
   ```
3. **에러 메시지 확인:**
   - `Owner password not configured` → 환경변수가 설정되지 않음
   - `Invalid password` → 비밀번호가 일치하지 않음
   - `Owner token secret not configured` → `OWNER_TOKEN_SECRET`이 설정되지 않음

---

## 🛠️ 해결 방법

### 방법 1: 비밀번호 재설정 (가장 확실)

1. **Render 대시보드 → Environment Variables**
2. **`OWNER_PASSWORD` 값 수정**
   - 간단한 값으로 시작: `test123`
   - 또는 원하는 비밀번호로 설정
3. **Save Changes 클릭**
4. **Manual Deploy 실행**
5. **배포 완료 후 로그인 테스트**

### 방법 2: 값 확인 및 수정

1. **Render UI에서 `OWNER_PASSWORD` 값 확인**
   - 값이 보이지 않으므로, 새로 입력
2. **값을 정확히 입력**
   - 앞뒤 공백 없이
   - 대소문자 정확히
3. **Save Changes → Manual Deploy**

### 방법 3: 디버깅용 임시 로그 추가 (고급)

서버 코드에 임시 로그를 추가하여 실제 값을 확인:

```javascript
// server/src/routes/ownerRoutes.js (임시)
console.log("OWNER_PASSWORD length:", ownerPassword.length);
console.log("OWNER_PASSWORD first char:", ownerPassword.charCodeAt(0));
console.log("OWNER_PASSWORD last char:", ownerPassword.charCodeAt(ownerPassword.length - 1));
```

**주의:** 실제 비밀번호를 로그에 출력하지 마세요! 길이와 첫/마지막 문자만 확인.

---

## 🔐 비밀번호 설정 권장사항

### 좋은 비밀번호 예시

```
✅ tennis-admin-2024
✅ GoodMorning!123
✅ Owner@Club2024
```

### 피해야 할 비밀번호

```
❌ password (너무 간단)
❌ 123456 (너무 간단)
❌ owner (너무 간단)
```

### 비밀번호 설정 시 주의사항

1. **길이:** 최소 8자 이상 권장
2. **복잡도:** 대소문자, 숫자, 특수문자 조합
3. **기억하기 쉬운 것:** 하지만 추측하기 어려운 것
4. **정기적 변경:** 보안을 위해 주기적으로 변경

---

## 🧪 테스트 절차

### 1. 간단한 값으로 테스트

```
1. Render → Environment Variables
2. OWNER_PASSWORD = test123 (임시)
3. Save Changes
4. Manual Deploy
5. 배포 완료 대기
6. test123으로 로그인 시도
```

**결과:**
- ✅ 성공 → 원래 비밀번호 문제 (값이 다름)
- ❌ 실패 → 다른 문제 (서버 연결, 환경변수 미적용 등)

### 2. 원래 비밀번호로 복원

```
1. OWNER_PASSWORD = (원하는 비밀번호)
2. Save Changes
3. Manual Deploy
4. 배포 완료 후 로그인 테스트
```

---

## 📋 체크리스트

비밀번호 문제 해결 전 확인:

- [ ] Render 대시보드에서 `OWNER_PASSWORD` 변수가 존재하는가?
- [ ] `OWNER_PASSWORD` 값이 비어있지 않은가?
- [ ] 환경변수 변경 후 **Manual Deploy**를 실행했는가?
- [ ] 배포가 완료되었는가? (로그에서 "live" 메시지 확인)
- [ ] 입력한 비밀번호에 앞뒤 공백이 없는가?
- [ ] 대소문자를 정확히 입력했는가?
- [ ] 특수문자를 정확히 입력했는가?
- [ ] `OWNER_TOKEN_SECRET`도 설정되어 있는가?

---

## 🚨 자주 발생하는 실수

### 실수 1: Manual Deploy 안 함
- 환경변수만 변경하고 배포 안 함
- **해결:** Manual Deploy 필수!

### 실수 2: 공백 포함
- 복사/붙여넣기 시 앞뒤 공백 포함
- **해결:** 직접 타이핑하거나 공백 제거

### 실수 3: 대소문자 오류
- `Password`를 `password`로 입력
- **해결:** 정확히 일치하도록 입력

### 실수 4: 다른 서비스의 비밀번호 사용
- `good-morning-tennis-club-v2`가 아닌 다른 서비스의 비밀번호 사용
- **해결:** 올바른 서비스의 환경변수 확인

---

## 💡 추가 팁

### 비밀번호 관리

1. **비밀번호 관리자 사용**
   - 1Password, LastPass 등
   - 안전하게 저장 및 복사

2. **비밀번호 문서화 (안전한 곳에)**
   - 개인 비밀번호 관리자에 저장
   - GitHub이나 공개 장소에는 절대 저장하지 마세요!

3. **정기적 변경**
   - 3-6개월마다 변경 권장

---

**문제가 계속되면:**
1. Render 서버 로그 확인 (에러 메시지)
2. 브라우저 개발자 도구(F12) → Network 탭에서 API 응답 확인
3. 임시로 간단한 비밀번호(`test123`)로 테스트하여 문제 격리

