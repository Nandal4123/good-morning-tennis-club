# 관리자 비밀번호 재설정 가이드

## 문제 원인

DB 롤백으로 인해 클럽의 `adminPasswordHash`가 어제 시점으로 되돌아갔습니다.
현재 클라이언트 코드에서 사용하는 비밀번호와 DB의 해시가 일치하지 않습니다.

## 현재 사용 중인 비밀번호

클라이언트 코드(`client/src/pages/Login.jsx`)에서 하드코딩된 비밀번호:
- **Good Morning Club (default)**: `admin0405`
- **Ace Club**: `admin7171`

## 해결 방법

### 방법 1: Owner 대시보드에서 재설정 (권장)

1. **Owner로 로그인**
   - Owner 비밀번호: `owner2025` (또는 Render에 설정된 값)
   - URL: `https://good-morning-tennis-club.vercel.app/?owner=1`

2. **각 클럽의 관리자 비밀번호 재설정**
   - Owner 대시보드에서 각 클럽 선택
   - "관리자 비밀번호 설정" 메뉴에서:
     - Good Morning Club: `admin0405`
     - Ace Club: `admin7171`

### 방법 2: Render에서 직접 실행 (고급)

Render 서버의 Shell에서 다음 명령 실행:

```bash
cd server
DEFAULT_ADMIN_PASSWORD="admin0405" ACE_ADMIN_PASSWORD="admin7171" node scripts/fix-admin-passwords.js
```

### 방법 3: 로컬에서 실행 (DATABASE_URL 필요)

로컬에서 실행하려면 올바른 DATABASE_URL이 필요합니다:

```bash
cd server
DATABASE_URL="[실제_DATABASE_URL]" \
DEFAULT_ADMIN_PASSWORD="admin0405" \
ACE_ADMIN_PASSWORD="admin7171" \
node scripts/fix-admin-passwords.js
```

## 확인

재설정 후:
1. 각 클럽의 관리자로 로그인 시도
2. 비밀번호가 정상적으로 작동하는지 확인

## 참고

- `server/scripts/fix-admin-passwords.js` 스크립트가 생성되어 있습니다.
- 이 스크립트는 클라이언트 코드의 하드코딩된 비밀번호를 기준으로 DB의 해시를 재설정합니다.




