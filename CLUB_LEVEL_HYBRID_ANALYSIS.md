# 클럽 단위 하이브리드 방식 분석: 신규 클럽만 전화번호 사용

## 📋 개요

기존 클럽은 이메일을 그대로 사용하고, **새로 등록하는 클럽만 전화번호를 사용**하도록 하는 클럽 단위 하이브리드 방식에 대한 분석입니다.

## ✅ 클럽 단위 하이브리드 방식의 장점

### 1. 클럽별 일관성 유지
- ✅ **클럽 내부 일관성**: 같은 클럽 내 모든 회원이 동일한 방식 사용
- ✅ **명확한 구분**: 클럽별로 이메일 또는 전화번호 중 하나만 사용
- ✅ **UI 단순화**: 클럽별로 조건부 로직 적용 가능

### 2. 기존 클럽 영향 없음
- ✅ **기존 클럽 보호**: 굿모닝 클럽, 에이스 클럽 등 기존 클럽은 변경 없음
- ✅ **데이터 마이그레이션 불필요**: 기존 클럽 데이터 그대로 유지
- ✅ **서비스 중단 없음**: 기존 클럽 회원은 영향 없음

### 3. 점진적 전환
- ✅ **신규 클럽만 적용**: 새로 만드는 클럽부터 전화번호 사용
- ✅ **선택권 제공**: 클럽 생성 시 이메일/전화번호 선택 가능
- ✅ **자연스러운 전환**: 시간이 지나면서 전화번호 클럽 비율 증가

### 4. 개발 복잡도 감소
- ✅ **클럽별 설정**: 클럽에 `usePhoneNumber` 플래그 추가
- ✅ **조건부 로직**: 클럽 설정에 따라 UI/API 분기
- ✅ **명확한 규칙**: 클럽 단위로 일관된 정책 적용

## ⚠️ 고려사항

### 1. 클럽 설정 관리

#### Club 모델에 설정 추가
```prisma
model Club {
  id                String   @id @default(cuid())
  name              String
  subdomain         String   @unique
  usePhoneNumber    Boolean  @default(false)  // 신규 클럽용 플래그
  adminPasswordHash String?
  joinCodeHash      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  users    User[]
  sessions Session[]
  matches  Match[]
  
  @@map("clubs")
}
```

#### 클럽 생성 시 설정
- 기존 클럽: `usePhoneNumber = false` (기본값)
- 신규 클럽: `usePhoneNumber = true` (선택 가능)

### 2. User 모델 변경

```prisma
model User {
  id              String      @id @default(cuid())
  email           String?     @unique  // 기존 클럽용 (옵셔널)
  phone           String?     @unique  // 신규 클럽용 (옵셔널)
  name            String
  role            UserRole    @default(USER)
  clubId          String?
  // ... 기타 필드
  
  club            Club?       @relation(fields: [clubId], references: [id])
  
  // 클럽별 제약조건: 클럽이 usePhoneNumber=true면 phone 필수, false면 email 필수
  @@index([clubId])
  @@map("users")
}
```

### 3. 회원가입 로직 분기

#### 클럽 설정 확인
```javascript
// 클럽 정보 조회 시 usePhoneNumber 확인
const club = await req.prisma.club.findUnique({
  where: { subdomain: clubSubdomain },
  select: { usePhoneNumber: true }
});

// 클럽 설정에 따라 필수 필드 결정
if (club.usePhoneNumber) {
  // 전화번호 필수, 이메일 null
  if (!phone) {
    return res.status(400).json({ error: "전화번호를 입력해주세요." });
  }
} else {
  // 이메일 필수, 전화번호 null
  if (!email) {
    return res.status(400).json({ error: "이메일을 입력해주세요." });
  }
}
```

## 🔧 구현 방안

### 1. 데이터베이스 스키마 변경

#### Club 모델
```prisma
model Club {
  id                String   @id @default(cuid())
  name              String
  subdomain         String   @unique
  usePhoneNumber    Boolean  @default(false)  // 신규 필드 추가
  adminPasswordHash String?
  joinCodeHash      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  users    User[]
  sessions Session[]
  matches  Match[]
  
  @@map("clubs")
}
```

#### User 모델
```prisma
model User {
  id              String      @id @default(cuid())
  email           String?     @unique  // 기존 클럽용
  phone           String?     @unique  // 신규 클럽용
  name            String
  role            UserRole    @default(USER)
  clubId          String?
  // ... 기타 필드
  
  club            Club?       @relation(fields: [clubId], references: [id])
  
  @@index([clubId])
  @@map("users")
}
```

### 2. 클럽 생성 API 변경

#### createClub 함수
```javascript
export const createClub = async (req, res) => {
  try {
    const { 
      name, 
      subdomain, 
      adminPassword, 
      joinCode,
      usePhoneNumber = true  // 신규 클럽은 기본적으로 전화번호 사용
    } = req.body;

    // ... 기존 검증 로직 ...

    const club = await req.prisma.club.create({
      data: {
        name: name.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        usePhoneNumber,  // 신규 필드
        adminPasswordHash,
        joinCodeHash,
      },
    });

    return res.status(201).json(club);
  } catch (error) {
    // ... 에러 처리 ...
  }
};
```

### 3. 회원가입 API 변경

#### createUser 함수
```javascript
export const createUser = async (req, res) => {
  try {
    const {
      phone,      // 신규 클럽용
      email,      // 기존 클럽용
      name,
      role,
      // ... 기타 필드
    } = req.body;

    // 멀티 테넌트: clubId 자동 할당
    let clubId = getClubFilter(req);
    if (!clubId) {
      // MVP 모드: 기본 클럽 ID 사용
      const clubInfo = getClubInfo(req);
      clubId = clubInfo.id;
    }

    // 클럽 정보 조회 (usePhoneNumber 확인)
    const club = await req.prisma.club.findUnique({
      where: { id: clubId },
      select: { usePhoneNumber: true }
    });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    // 클럽 설정에 따라 필수 필드 검증
    if (club.usePhoneNumber) {
      // 신규 클럽: 전화번호 필수
      if (!phone) {
        return res.status(400).json({ 
          error: "전화번호를 입력해주세요." 
        });
      }
      
      // 전화번호 형식 검증
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({ 
          error: "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)" 
        });
      }

      // 전화번호 중복 체크
      const existingPhone = await req.prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        return res.status(400).json({ 
          error: "이미 등록된 전화번호입니다." 
        });
      }
    } else {
      // 기존 클럽: 이메일 필수
      if (!email) {
        return res.status(400).json({ 
          error: "이메일을 입력해주세요." 
        });
      }

      // 이메일 중복 체크
      const existingEmail = await req.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return res.status(400).json({ 
          error: "이미 등록된 이메일입니다." 
        });
      }
    }

    // 사용자 생성
    const user = await req.prisma.user.create({
      data: {
        phone: club.usePhoneNumber ? phone : null,
        email: club.usePhoneNumber ? null : email,
        name,
        role: role || "USER",
        // ... 기타 필드
        clubId: clubId || null,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ 
        error: "이미 등록된 전화번호 또는 이메일입니다." 
      });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};
```

### 4. 프론트엔드 회원가입 폼

#### Login.jsx 변경
```jsx
// 클럽 정보 로드 시 usePhoneNumber 확인
const [clubUsesPhone, setClubUsesPhone] = useState(false);

useEffect(() => {
  const loadClubInfo = async () => {
    try {
      const info = await clubApi.getInfo();
      setClubInfo(info);
      setClubUsesPhone(info.usePhoneNumber || false);
    } catch (error) {
      // ...
    }
  };
  loadClubInfo();
}, []);

// 회원가입 폼
{clubUsesPhone ? (
  // 신규 클럽: 전화번호 입력
  <div>
    <label>전화번호 *</label>
    <input
      type="tel"
      required
      value={newUser.phone}
      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
      placeholder="010-1234-5678"
    />
  </div>
) : (
  // 기존 클럽: 이메일 입력
  <div>
    <label>이메일 *</label>
    <input
      type="email"
      required
      value={newUser.email}
      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
      placeholder="example@email.com"
    />
  </div>
)}
```

### 5. UI 표시 로직

#### 공통 헬퍼 함수
```javascript
// lib/userUtils.js
export const getUserContact = (user, club) => {
  // 클럽 설정 확인
  if (club?.usePhoneNumber) {
    return user.phone || '전화번호 없음';
  } else {
    return user.email || '이메일 없음';
  }
};

// 클럽 정보 없이 사용 (fallback)
export const getUserContactFallback = (user) => {
  return user.phone || user.email || '연락처 없음';
};
```

#### 컴포넌트에서 사용
```jsx
// Members.jsx
import { getUserContact } from '../lib/userUtils';

// 클럽 정보와 함께 사용
<p className="text-sm text-slate-400">
  {getUserContact(member, clubInfo)}
</p>
```

### 6. Owner 대시보드 클럽 생성

#### OwnerDashboard.jsx
```jsx
const [newClub, setNewClub] = useState({
  name: "",
  subdomain: "",
  adminPassword: "",
  joinCode: "",
  usePhoneNumber: true,  // 신규 클럽은 기본적으로 전화번호 사용
});

// 클럽 생성 폼
<div>
  <label>회원가입 방식</label>
  <select
    value={newClub.usePhoneNumber ? "phone" : "email"}
    onChange={(e) => 
      setNewClub({ 
        ...newClub, 
        usePhoneNumber: e.target.value === "phone" 
      })
    }
  >
    <option value="phone">전화번호 (신규 권장)</option>
    <option value="email">이메일 (기존 방식)</option>
  </select>
</div>
```

## 📊 클럽 단위 하이브리드 vs 전체 하이브리드 비교

| 항목 | 클럽 단위 하이브리드 | 전체 하이브리드 |
|------|---------------------|----------------|
| 클럽 내부 일관성 | ✅ 높음 (클럽별 통일) | ⚠️ 낮음 (혼재) |
| UI 복잡도 | ✅ 낮음 (클럽별 분기) | ⚠️ 높음 (사용자별 분기) |
| 검색 복잡도 | ✅ 낮음 (클럽별 단일) | ⚠️ 높음 (둘 다) |
| 기존 클럽 영향 | ✅ 없음 | ✅ 없음 |
| 개발 복잡도 | ⚠️ 중간 | ⚠️ 중간 |
| 데이터 일관성 | ✅ 높음 | ⚠️ 낮음 |

## 💡 최종 권장사항

### 클럽 단위 하이브리드 방식이 적합한 경우
- ✅ **클럽별 일관성이 중요한 경우**
- ✅ **기존 클럽을 보호하면서 신규 클럽에만 적용하고 싶은 경우**
- ✅ **UI/UX 단순화가 중요한 경우**
- ✅ **클럽별로 다른 정책을 적용하고 싶은 경우**

### 구현 전략
1. **기존 클럽**: `usePhoneNumber = false` (기본값)
2. **신규 클럽**: `usePhoneNumber = true` (기본값, 선택 가능)
3. **클럽 생성 시**: Owner가 이메일/전화번호 선택 가능
4. **회원가입**: 클럽 설정에 따라 자동으로 필수 필드 결정

## 🔧 구현 체크리스트

### 데이터베이스
- [ ] Club 모델에 `usePhoneNumber` 필드 추가
- [ ] User 모델에 `phone` 필드 추가 (옵셔널, unique)
- [ ] User 모델의 `email` 필드를 옵셔널로 변경 (unique 유지)
- [ ] 마이그레이션 스크립트 작성
- [ ] 기존 클럽 데이터: `usePhoneNumber = false` 설정

### 백엔드
- [ ] `createClub`: `usePhoneNumber` 파라미터 추가
- [ ] `getClubBySubdomain`: `usePhoneNumber` 반환
- [ ] `createUser`: 클럽 설정에 따라 phone/email 검증
- [ ] 전화번호 검증 함수 추가
- [ ] 전화번호 정규화 함수 추가

### 프론트엔드
- [ ] `Login.jsx`: 클럽 설정에 따라 회원가입 폼 분기
- [ ] `OwnerDashboard.jsx`: 클럽 생성 시 usePhoneNumber 선택
- [ ] `userUtils.js`: 클럽별 연락처 표시 헬퍼 함수
- [ ] 모든 UI 컴포넌트: 클럽 정보와 함께 연락처 표시
- [ ] 검색 기능: 클럽 설정에 따라 phone/email 검색

### 테스트
- [ ] 기존 클럽 회원가입 테스트 (이메일)
- [ ] 신규 클럽 회원가입 테스트 (전화번호)
- [ ] 클럽별 UI 표시 테스트
- [ ] 검색 기능 테스트
- [ ] Owner 대시보드 클럽 생성 테스트

## 📝 예상 작업량

| 작업 | 시간 | 난이도 |
|------|------|--------|
| 데이터베이스 스키마 | 1-2시간 | 낮음 |
| 백엔드 API 변경 | 3-4시간 | 중간 |
| 프론트엔드 UI 변경 | 3-4시간 | 중간 |
| Owner 대시보드 | 1시간 | 낮음 |
| 테스트 | 2시간 | 중간 |
| **총계** | **10-13시간** | **중간** |

## 🎯 결론

클럽 단위 하이브리드 방식은 **클럽별 일관성을 유지하면서 점진적으로 전환**할 수 있는 최적의 방법입니다. 기존 클럽은 그대로 유지하고, 신규 클럽만 전화번호를 사용하므로 리스크가 최소화됩니다.

**추천**: 클럽 단위 하이브리드 방식으로 진행하되, 신규 클럽은 기본적으로 전화번호를 사용하도록 설정하는 것을 권장합니다.

