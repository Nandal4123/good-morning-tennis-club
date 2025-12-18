# 💰 수익사업 전환 전략 (SaaS 모델)

테니스 클럽 출석 관리 앱을 수익사업으로 전환하기 위한 완전한 전략입니다.

---

## 🎯 추천 방식: 멀티 테넌트 SaaS (Software as a Service)

**왜 이 방식인가?**
- ✅ **확장 가능**: 수백 개의 클럽을 하나의 시스템으로 관리
- ✅ **수익 모델 명확**: 구독 기반으로 안정적인 수익
- ✅ **운영 효율**: 중앙 관리로 유지보수 비용 절감
- ✅ **데이터 통합**: 모든 클럽 데이터 분석 가능
- ✅ **자동 업데이트**: 모든 클럽에 동시 적용

---

## 📊 비즈니스 모델

### 구독 요금제

#### 1. 무료 플랜 (Free Tier)
- **가격**: 무료
- **제한사항**:
  - 최대 회원 수: 10명
  - 최대 경기 기록: 50개/월
  - 기본 기능만 제공
- **목적**: 사용자 확보 및 마케팅

#### 2. 베이직 플랜 (Basic)
- **가격**: 월 29,000원 (또는 연 290,000원)
- **제한사항**:
  - 최대 회원 수: 30명
  - 무제한 경기 기록
  - 기본 통계 및 리포트
- **대상**: 소규모 클럽 (10-30명)

#### 3. 프로 플랜 (Pro)
- **가격**: 월 59,000원 (또는 연 590,000원)
- **제한사항**:
  - 최대 회원 수: 100명
  - 무제한 경기 기록
  - 고급 통계 및 분석
  - 커스텀 리포트
  - 우선 지원
- **대상**: 중규모 클럽 (30-100명)

#### 4. 엔터프라이즈 플랜 (Enterprise)
- **가격**: 월 149,000원 (또는 연 1,490,000원)
- **제한사항**:
  - 무제한 회원 수
  - 무제한 경기 기록
  - 모든 기능
  - 전담 지원
  - 커스터마이징 가능
  - API 접근
- **대상**: 대규모 클럽 (100명 이상)

### 수익 예상

| 플랜 | 월 가격 | 연 가격 | 예상 가입률 | 월 수익 (100개 클럽) |
|------|---------|---------|-------------|---------------------|
| 무료 | 0원 | 0원 | 40% | 0원 |
| 베이직 | 29,000원 | 290,000원 | 35% | 1,015,000원 |
| 프로 | 59,000원 | 590,000원 | 20% | 1,180,000원 |
| 엔터프라이즈 | 149,000원 | 1,490,000원 | 5% | 745,000원 |
| **합계** | - | - | 100% | **2,940,000원/월** |

**연간 수익 예상**: 약 3,500만원 (100개 클럽 기준)

---

## 🏗️ 기술 구현 방안

### 1. 데이터베이스 스키마 변경

```prisma
// 클럽 모델 추가
model Club {
  id              String    @id @default(cuid())
  name            String
  subdomain       String    @unique  // 예: "morning-club"
  domain          String?   @unique  // 커스텀 도메인 (Enterprise)
  plan            Plan      @default(FREE)
  status          ClubStatus @default(ACTIVE)
  maxMembers     Int       @default(10)
  currentMembers Int       @default(0)
  
  // 결제 정보
  subscriptionId String?   @unique  // Stripe subscription ID
  subscriptionStatus SubscriptionStatus?
  trialEndsAt     DateTime?
  subscriptionEndsAt DateTime?
  
  // 설정
  settings       Json?     // 클럽별 설정
  logo           String?   // 로고 URL
  theme          Json?     // 테마 설정
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  users          User[]
  sessions       Session[]
  matches        Match[]
  
  @@map("clubs")
}

enum Plan {
  FREE
  BASIC
  PRO
  ENTERPRISE
}

enum ClubStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELLED
}

// 사용자 모델 수정
model User {
  id              String    @id @default(cuid())
  clubId          String    // 클럽 소속
  email           String
  name            String
  role            UserRole  @default(USER)
  // ... 기존 필드들
  
  club            Club      @relation(fields: [clubId], references: [id])
  
  // 이메일은 클럽 내에서만 unique
  @@unique([clubId, email])
  @@index([clubId])
  @@map("users")
}

// 세션 모델 수정
model Session {
  id          String   @id @default(cuid())
  clubId      String   // 클럽 소속
  date        DateTime
  description String?
  createdAt   DateTime @default(now())
  
  club        Club      @relation(fields: [clubId], references: [id])
  attendances Attendance[]
  
  @@index([clubId])
  @@map("sessions")
}

// 경기 모델 수정
model Match {
  id        String    @id @default(cuid())
  clubId   String    // 클럽 소속
  date     DateTime
  type     MatchType  @default(DOUBLES)
  // ... 기존 필드들
  
  club      Club      @relation(fields: [clubId], references: [id])
  
  @@index([clubId])
  @@map("matches")
}
```

### 2. 인증 시스템 변경

#### 옵션 A: 서브도메인 방식 (추천)
```
morning-club.tennisapp.com  → Morning Club
evening-club.tennisapp.com  → Evening Club
```

**장점:**
- 각 클럽이 독립적인 URL
- 브랜딩 용이
- SEO 최적화

**구현:**
```javascript
// middleware/clubResolver.js
export const resolveClub = async (req, res, next) => {
  const host = req.get('host');
  const subdomain = host.split('.')[0];
  
  const club = await prisma.club.findUnique({
    where: { subdomain },
  });
  
  if (!club || club.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Club not found' });
  }
  
  // 구독 상태 확인
  if (club.subscriptionStatus !== 'ACTIVE' && club.plan !== 'FREE') {
    return res.status(403).json({ error: 'Subscription expired' });
  }
  
  req.club = club;
  next();
};
```

#### 옵션 B: 클럽 선택 화면
```
tennisapp.com → 클럽 선택 → 로그인
```

**장점:**
- 구현 간단
- 단일 도메인 관리

**단점:**
- 브랜딩 어려움
- 사용자 경험 복잡

### 3. API 수정 (클럽별 데이터 격리)

```javascript
// 모든 API에 clubId 필터 추가
export const getAllUsers = async (req, res) => {
  try {
    const clubId = req.club.id; // middleware에서 설정
    
    const users = await req.prisma.user.findMany({
      where: { clubId }, // 클럽별 필터
      orderBy: { name: "asc" },
    });
    
    res.json(users);
  } catch (error) {
    // ...
  }
};
```

### 4. 결제 시스템 통합 (Stripe)

```javascript
// routes/subscriptionRoutes.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 구독 생성
export const createSubscription = async (req, res) => {
  const { clubId, plan, paymentMethodId } = req.body;
  
  // Stripe 고객 생성
  const customer = await stripe.customers.create({
    payment_method: paymentMethodId,
    email: req.club.ownerEmail,
  });
  
  // 구독 생성
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: getPriceId(plan) }],
    trial_period_days: 14, // 14일 무료 체험
  });
  
  // 데이터베이스 업데이트
  await prisma.club.update({
    where: { id: clubId },
    data: {
      plan,
      subscriptionId: subscription.id,
      subscriptionStatus: 'TRIALING',
      trialEndsAt: new Date(subscription.trial_end * 1000),
    },
  });
  
  res.json({ subscription });
};

// Webhook 처리 (구독 상태 변경)
export const handleWebhook = async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'customer.subscription.updated':
      await updateSubscriptionStatus(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await cancelSubscription(event.data.object);
      break;
  }
  
  res.json({ received: true });
};
```

### 5. 사용량 모니터링

```javascript
// middleware/usageTracker.js
export const trackUsage = async (req, res, next) => {
  const club = req.club;
  
  // 회원 수 체크
  if (req.method === 'POST' && req.path.includes('/users')) {
    const memberCount = await prisma.user.count({
      where: { clubId: club.id },
    });
    
    if (memberCount >= club.maxMembers && club.plan !== 'ENTERPRISE') {
      return res.status(403).json({
        error: 'Member limit reached',
        currentPlan: club.plan,
        maxMembers: club.maxMembers,
      });
    }
  }
  
  next();
};
```

### 6. 관리자 대시보드

```javascript
// routes/adminRoutes.js
// 전체 클럽 관리
export const getAllClubs = async (req, res) => {
  const clubs = await prisma.club.findMany({
    include: {
      _count: {
        select: { users: true, matches: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(clubs);
};

// 통계
export const getStats = async (req, res) => {
  const stats = {
    totalClubs: await prisma.club.count(),
    activeSubscriptions: await prisma.club.count({
      where: { subscriptionStatus: 'ACTIVE' },
    }),
    monthlyRevenue: await calculateMonthlyRevenue(),
    // ...
  };
  
  res.json(stats);
};
```

---

## 🚀 마이그레이션 전략

### 단계별 전환 계획

#### Phase 1: 기반 구축 (1-2개월)
1. 데이터베이스 스키마 변경
2. 멀티 테넌트 미들웨어 구현
3. 클럽 모델 및 API 수정
4. 테스트 환경 구축

#### Phase 2: 결제 시스템 (1개월)
1. Stripe 통합
2. 구독 관리 시스템
3. Webhook 처리
4. 결제 UI 구현

#### Phase 3: 관리자 대시보드 (1개월)
1. 전체 클럽 관리 화면
2. 통계 및 분석
3. 사용량 모니터링
4. 고객 지원 도구

#### Phase 4: 마케팅 및 런칭 (1개월)
1. 랜딩 페이지 제작
2. 가격 페이지
3. 마케팅 자료
4. 베타 테스트

---

## 💡 추가 수익 모델

### 1. 프리미엄 기능
- 커스텀 도메인 (Enterprise)
- API 접근 (Enterprise)
- 고급 분석 리포트 (Pro 이상)
- 화이트라벨 (Enterprise)

### 2. 부가 서비스
- SMS 알림 서비스
- 이메일 마케팅 통합
- 소셜 미디어 연동
- 모바일 앱 (별도 구독)

### 3. 파트너십
- 테니스 용품 쇼핑몰 연동
- 코치 매칭 서비스
- 대회 관리 시스템 연동

---

## 📈 성장 전략

### 1. 무료 플랜 활용
- 무료 사용자 확보
- 입소문 마케팅
- 자연스러운 업그레이드 유도

### 2. 바이럴 마케팅
- 클럽 간 경쟁 기능
- 소셜 공유 기능
- 추천 프로그램

### 3. 콘텐츠 마케팅
- 테니스 클럽 운영 블로그
- 베스트 프랙티스 가이드
- 성공 사례 공유

---

## ⚠️ 주의사항

### 1. 데이터 보안
- 클럽별 데이터 완전 격리
- GDPR 준수
- 개인정보 보호

### 2. 성능 최적화
- 데이터베이스 인덱싱
- 캐싱 전략
- CDN 활용

### 3. 고가용성
- 백업 시스템
- 재해 복구 계획
- 모니터링 및 알림

---

## 💰 비용 구조

### 월 운영 비용 (예상)

| 항목 | 비용 |
|------|------|
| Supabase (Pro) | $25/월 |
| Render (Pro) | $25/월 |
| Vercel (Pro) | $20/월 |
| Stripe 수수료 | 거래액의 2.9% + 300원 |
| 도메인 | $1/월 |
| 모니터링 | $10/월 |
| **합계** | **약 $81/월 (약 10만원)** |

**100개 클럽 기준 순수익**: 약 280만원/월

---

## 🎯 결론

**멀티 테넌트 SaaS 모델이 수익사업 전환에 가장 적합합니다.**

### 핵심 포인트:
1. ✅ **확장 가능한 아키텍처**: 수백 개 클럽 지원
2. ✅ **명확한 수익 모델**: 구독 기반 안정 수익
3. ✅ **운영 효율**: 중앙 관리로 비용 절감
4. ✅ **성장 가능성**: 무료 플랜으로 사용자 확보 후 전환

### 다음 단계:
1. 멀티 테넌트 아키텍처 설계
2. Stripe 결제 시스템 통합
3. 관리자 대시보드 구축
4. 베타 테스트 및 런칭

