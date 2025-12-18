# 🔍 Owner 로그인 디버깅 가이드

로그인이 실패했을 때 문제를 찾는 방법입니다.

---

## 🎯 방법 1: 디버깅 엔드포인트 확인 (가장 빠름)

### 1단계: 디버깅 엔드포인트 접속

브라우저에서 다음 URL 접속:

```
https://good-morning-tennis-club-v2.onrender.com/api/owner/debug
```

### 2단계: 응답 확인

다음과 같은 JSON 응답이 나타납니다:

**정상적인 경우:**
```json
{
  "ownerPasswordConfigured": true,
  "ownerPasswordLength": 12,
  "ownerPasswordFirstChar": "o",
  "ownerPasswordLastChar": "5",
  "ownerTokenSecretConfigured": true,
  "ownerPasswordPreview": "own...2025"
}
```

**문제가 있는 경우:**

**케이스 1: 환경변수 미설정**
```json
{
  "ownerPasswordConfigured": false,
  "ownerPasswordLength": 0,
  "ownerPasswordFirstChar": null,
  "ownerPasswordLastChar": null,
  "ownerTokenSecretConfigured": true,
  "ownerPasswordPreview": "(empty)"
}
```
→ Render에서 `OWNER_PASSWORD` 설정 필요

**케이스 2: 길이가 다름**
```json
{
  "ownerPasswordConfigured": true,
  "ownerPasswordLength": 11,  // 12가 아님!
  "ownerPasswordFirstChar": "o",
  "ownerPasswordLastChar": "5",
  ...
}
```
→ 환경변수 값이 `owner!-2025`가 아님 (뒤에 문자가 더 있거나 앞에 공백)

**케이스 3: 첫 문자가 다름**
```json
{
  "ownerPasswordConfigured": true,
  "ownerPasswordLength": 12,
  "ownerPasswordFirstChar": "O",  // 대문자 O!
  "ownerPasswordLastChar": "5",
  ...
}
```
→ 환경변수는 `Owner!-2025` (대문자 O), 입력은 `owner!-2025` (소문자 o)

### 3단계: 정보 분석

- **ownerPasswordLength**: 환경변수에 설정된 비밀번호 길이
  - `12` → `owner!-2025` (정상)
  - 다른 값 → 문제 있음

- **ownerPasswordFirstChar**: 첫 번째 문자
  - `"o"` → 소문자 o (정상)
  - `"O"` → 대문자 O (문제)

- **ownerPasswordLastChar**: 마지막 문자
  - `"5"` → 정상

- **ownerPasswordPreview**: 첫 3글자와 마지막 3글자
  - `"own...2025"` → `owner!-2025` (정상)

---

## 🎯 방법 2: Render 로그 확인 (가장 정확)

### 1단계: Render 대시보드 접속

1. **브라우저에서 접속:**
   ```
   https://dashboard.render.com
   ```

2. **로그인**

### 2단계: 서비스 선택

1. **"My project" 프로젝트 클릭**
2. **`good-morning-tennis-club-v2` 서비스 클릭**

### 3단계: Logs 탭 확인

1. **왼쪽 메뉴에서 "Logs" 탭 클릭**
2. **로그인 시도 직후 로그 확인**

### 4단계: 로그 메시지 확인

Owner 로그인 시도 시 다음 로그가 나타납니다:

**정상적인 경우:**
```
[Owner Login] 환경변수 확인:
  - OWNER_PASSWORD 설정됨: true
  - OWNER_PASSWORD 길이: 12
  - OWNER_TOKEN_SECRET 설정됨: true
  - 입력 비밀번호 길이: 12
  - OWNER_PASSWORD 첫 문자 코드: 111
  - OWNER_PASSWORD 마지막 문자 코드: 53
  - 입력 비밀번호 첫 문자 코드: 111
  - 입력 비밀번호 마지막 문자 코드: 53
[Owner Login] ✅ 비밀번호 일치, 토큰 발급
```

**문제가 있는 경우:**

**케이스 1: 환경변수 미설정**
```
[Owner Login] ❌ OWNER_PASSWORD 환경변수가 설정되지 않음
```
→ Render에서 `OWNER_PASSWORD` 설정 필요

**케이스 2: 비밀번호 불일치**
```
[Owner Login] 환경변수 확인:
  - OWNER_PASSWORD 설정됨: true
  - OWNER_PASSWORD 길이: 12
  - 입력 비밀번호 길이: 11
[Owner Login] ❌ 비밀번호 불일치:
  - 환경변수 길이: 12
  - 입력 길이: 11
  - 길이 일치: false
```
→ 입력한 비밀번호가 환경변수와 다름

**케이스 3: 첫 문자 코드 불일치**
```
[Owner Login] 환경변수 확인:
  - OWNER_PASSWORD 첫 문자 코드: 79  // 대문자 O
  - 입력 비밀번호 첫 문자 코드: 111  // 소문자 o
[Owner Login] ❌ 비밀번호 불일치
```
→ 대소문자 문제

### 5단계: 문자 코드 참조

- `111` = `o` (소문자)
- `79` = `O` (대문자)
- `33` = `!` (느낌표)
- `45` = `-` (하이픈)
- `50` = `2` (숫자)
- `53` = `5` (숫자)

---

## 🔧 문제 해결 방법

### 문제 1: 환경변수 미설정

**해결:**
1. Render 대시보드 → `good-morning-tennis-club-v2` 서비스
2. Environment 탭
3. `OWNER_PASSWORD` = `owner!-2025` 추가
4. Save Changes
5. Manual Deploy 실행

### 문제 2: 길이가 다름

**해결:**
1. Render → Environment Variables
2. `OWNER_PASSWORD` 값 확인
3. 앞뒤 공백 제거
4. 정확히 `owner!-2025`로 설정
5. Save Changes → Manual Deploy

### 문제 3: 대소문자 문제

**해결:**
1. Render → Environment Variables
2. `OWNER_PASSWORD` 값 확인
3. 소문자 `owner`로 시작하는지 확인
4. 필요 시 `owner!-2025`로 수정
5. Save Changes → Manual Deploy

### 문제 4: 입력 비밀번호 문제

**해결:**
1. 브라우저에서 입력할 때 정확히 `owner!-2025` 입력
2. 앞뒤 공백 없이
3. 대소문자 정확히
4. 직접 타이핑 권장 (복사/붙여넣기 시 보이지 않는 문자 포함 가능)

---

## 📋 체크리스트

- [ ] 디버깅 엔드포인트 접속: `https://good-morning-tennis-club-v2.onrender.com/api/owner/debug`
- [ ] 응답에서 `ownerPasswordLength` 확인 (12여야 함)
- [ ] 응답에서 `ownerPasswordFirstChar` 확인 ("o"여야 함)
- [ ] 응답에서 `ownerPasswordPreview` 확인 ("own...2025"여야 함)
- [ ] Render 로그에서 `[Owner Login]` 메시지 확인
- [ ] 로그에서 길이 비교 확인
- [ ] 로그에서 문자 코드 비교 확인

---

## 💡 빠른 확인 방법

**가장 빠른 방법: 디버깅 엔드포인트**

1. 브라우저에서 `https://good-morning-tennis-club-v2.onrender.com/api/owner/debug` 접속
2. JSON 응답 확인
3. `ownerPasswordPreview`가 `"own...2025"`인지 확인
4. `ownerPasswordLength`가 `12`인지 확인

이 정보만으로도 환경변수 상태를 바로 확인할 수 있습니다!

---

**디버깅 엔드포인트 결과나 Render 로그를 알려주시면 정확한 원인을 파악할 수 있습니다!**

