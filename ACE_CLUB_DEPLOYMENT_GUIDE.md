# 에이스클럽 배포 가이드

## 📋 개요

에이스클럽을 카카오톡 등 메신저로 공유할 때 올바른 링크를 사용해야 합니다. 일반 URL(`?club=ace-club`)을 직접 공유하면 카카오톡 미리보기에서 "굿모닝 테니스 클럽"으로 표시되는 문제가 발생합니다.

## ✅ 올바른 공유 링크 사용법

### 1. 공유 링크 형식

**❌ 잘못된 링크 (카톡에서 굿모닝으로 표시됨):**
```
https://good-morning-tennis-club.vercel.app/?club=ace-club
```

**✅ 올바른 링크 (카톡에서 에이스클럽으로 표시됨):**
```
https://good-morning-tennis-club.vercel.app/share?club=ace-club
```

### 2. 링크 생성 방법

#### 방법 1: Owner 대시보드에서 생성
1. Owner 계정으로 로그인
2. Owner 대시보드 접속 (`/owner`)
3. 에이스클럽 선택
4. "이동" 버튼 클릭 → 에이스클럽 페이지로 이동
5. 브라우저 주소창에서 URL 복사
6. **중요**: URL을 `/share?club=ace-club` 형식으로 변경

#### 방법 2: 직접 링크 생성
```
https://good-morning-tennis-club.vercel.app/share?club=ace-club
```

특정 페이지로 공유하려면:
```
https://good-morning-tennis-club.vercel.app/share?club=ace-club&path=/matches
```

## 🔧 왜 `/share` 엔드포인트를 사용해야 하나?

### 문제 원인
- 카카오톡/메신저는 링크 미리보기를 위해 **OG(Open Graph) 메타 태그**만 읽습니다
- Vite SPA는 모든 URL이 같은 `index.html`을 반환하므로, 직접 URL(`/?club=ace-club`)을 공유하면 항상 "굿모닝 테니스 클럽"의 OG 태그가 표시됩니다
- JavaScript는 실행되지 않으므로 클라이언트 측 라우팅이 작동하지 않습니다

### 해결 방법
- `/share` 엔드포인트는 서버에서 클럽별로 다른 OG 태그를 동적으로 생성합니다
- 카카오톡이 `/share?club=ace-club`을 읽으면 "Ace Club"의 OG 태그를 받습니다
- 그 후 자동으로 실제 앱 URL(`/?club=ace-club`)로 리다이렉트됩니다

## 📱 카카오톡 공유 절차

### 1. 올바른 링크 준비
```
https://good-morning-tennis-club.vercel.app/share?club=ace-club
```

### 2. 카카오톡에서 공유
1. 카카오톡 앱 열기
2. 채팅방 선택
3. 링크 입력 또는 붙여넣기
4. 전송

### 3. 확인 사항
- 링크 미리보기에 **"Ace Club"**이 표시되어야 합니다
- "굿모닝 테니스 클럽"이 표시되면 잘못된 링크입니다

## 🐛 문제 해결

### 문제 1: 카톡에서 여전히 "굿모닝"으로 표시됨

**원인:**
- 카카오톡 캐시 문제
- 잘못된 링크 사용

**해결:**
1. 올바른 `/share?club=ace-club` 링크 사용 확인
2. 카카오톡 캐시 무력화를 위해 링크에 버전 파라미터 추가:
   ```
   https://good-morning-tennis-club.vercel.app/share?club=ace-club&v=2
   ```
3. 카카오톡 개발자 도구에서 링크 다시 등록 (선택사항)

### 문제 2: 링크 클릭 후 에이스클럽이 아닌 굿모닝으로 이동

**원인:**
- URL 쿼리 파라미터가 유지되지 않음
- 브라우저 캐시 문제

**해결:**
1. 브라우저 캐시 삭제
2. 시크릿 모드에서 테스트
3. 링크에 `?club=ace-club` 파라미터가 포함되어 있는지 확인

### 문제 3: Owner 대시보드에서 "이동" 버튼이 작동하지 않음

**원인:**
- 클럽 정보가 올바르게 로드되지 않음
- 네비게이션 로직 오류

**해결:**
1. 브라우저 콘솔에서 에러 확인
2. Owner 대시보드 새로고침
3. 클럽 목록이 올바르게 표시되는지 확인

## 📝 배포 체크리스트

### 배포 전 확인
- [ ] 에이스클럽이 데이터베이스에 올바르게 생성되어 있음
- [ ] 에이스클럽의 `subdomain`이 `ace-club`인지 확인
- [ ] Owner 대시보드에서 에이스클럽이 표시되는지 확인
- [ ] `/share?club=ace-club` 링크가 올바른 OG 태그를 반환하는지 확인

### 배포 후 테스트
- [ ] `/share?club=ace-club` 링크 접속 시 "Ace Club" 제목 확인
- [ ] 링크 클릭 후 에이스클럽 페이지로 올바르게 이동하는지 확인
- [ ] 카카오톡에서 링크 공유 시 "Ace Club" 미리보기 확인
- [ ] 에이스클럽 데이터가 올바르게 표시되는지 확인

## 🔗 유용한 링크

### 에이스클럽 공유 링크
- 메인 페이지: `https://good-morning-tennis-club.vercel.app/share?club=ace-club`
- 경기 페이지: `https://good-morning-tennis-club.vercel.app/share?club=ace-club&path=/matches`
- 출석 페이지: `https://good-morning-tennis-club.vercel.app/share?club=ace-club&path=/attendance`
- 회원 페이지: `https://good-morning-tennis-club.vercel.app/share?club=ace-club&path=/members`

### 테스트 도구
- OG 태그 확인: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- 카카오톡 링크 미리보기: 카카오톡 앱에서 직접 테스트

## 📌 중요 사항

1. **항상 `/share` 엔드포인트 사용**: 직접 URL(`/?club=ace-club`)을 공유하지 마세요
2. **쿼리 파라미터 유지**: 링크를 복사할 때 `?club=ace-club` 파라미터가 포함되어 있는지 확인하세요
3. **카카오톡 캐시**: 링크를 변경했는데도 이전 미리보기가 표시되면 버전 파라미터(`&v=2`)를 추가하세요
4. **테스트**: 배포 후 반드시 카카오톡에서 실제로 테스트해보세요

## 🎯 요약

**에이스클럽을 카카오톡으로 공유할 때:**
```
✅ https://good-morning-tennis-club.vercel.app/share?club=ace-club
❌ https://good-morning-tennis-club.vercel.app/?club=ace-club
```

**기억하세요:**
- `/share` 엔드포인트를 사용하면 카카오톡에서 올바른 클럽 이름이 표시됩니다
- 직접 URL을 공유하면 항상 "굿모닝 테니스 클럽"으로 표시됩니다

