/**
 * API 테스트 스크립트
 *
 * 멀티 테넌트 마이그레이션 후 API가 정상 작동하는지 테스트합니다.
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

async function testAPI() {
  console.log("🧪 API 테스트 시작...\n");
  console.log(`📍 API Base URL: ${API_BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // 헬퍼 함수: API 요청
  async function request(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      return { ok: false, status: 0, error: error.message };
    }
  }

  // 테스트 헬퍼
  function test(name, condition, details = "") {
    if (condition) {
      console.log(`✅ ${name}`);
      results.passed++;
      results.tests.push({ name, status: "PASS", details });
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
      results.failed++;
      results.tests.push({ name, status: "FAIL", details });
    }
  }

  // 1. 헬스 체크
  console.log("1️⃣ 헬스 체크 테스트...");
  const healthCheck = await request("/api/health");
  test(
    "헬스 체크 응답",
    healthCheck.ok && healthCheck.data.status === "ok",
    healthCheck.ok
      ? ""
      : `Status: ${healthCheck.status}, Error: ${
          healthCheck.error || JSON.stringify(healthCheck.data)
        }`
  );
  console.log("");

  // 2. 사용자 목록 테스트
  console.log("2️⃣ 사용자 목록 API 테스트...");
  const usersResponse = await request("/api/users");
  test(
    "사용자 목록 조회 성공",
    usersResponse.ok && Array.isArray(usersResponse.data),
    usersResponse.ok
      ? `사용자 수: ${usersResponse.data.length}`
      : `Status: ${usersResponse.status}`
  );

  if (usersResponse.ok && usersResponse.data.length > 0) {
    const firstUser = usersResponse.data[0];
    test(
      "사용자에 clubId 포함",
      "clubId" in firstUser,
      firstUser.clubId ? `clubId: ${firstUser.clubId}` : "clubId가 없습니다"
    );
    test(
      "사용자 기본 필드 포함",
      "id" in firstUser && "name" in firstUser && "email" in firstUser,
      "기본 필드 확인 완료"
    );
  }
  console.log("");

  // 3. 세션 목록 테스트
  console.log("3️⃣ 세션 목록 API 테스트...");
  const sessionsResponse = await request("/api/sessions");
  test(
    "세션 목록 조회 성공",
    sessionsResponse.ok && Array.isArray(sessionsResponse.data),
    sessionsResponse.ok
      ? `세션 수: ${sessionsResponse.data.length}`
      : `Status: ${sessionsResponse.status}`
  );

  if (sessionsResponse.ok && sessionsResponse.data.length > 0) {
    const firstSession = sessionsResponse.data[0];
    test(
      "세션에 clubId 포함",
      "clubId" in firstSession,
      firstSession.clubId
        ? `clubId: ${firstSession.clubId}`
        : "clubId가 없습니다"
    );
    test(
      "세션 기본 필드 포함",
      "id" in firstSession && "date" in firstSession,
      "기본 필드 확인 완료"
    );
  }
  console.log("");

  // 4. 경기 목록 테스트
  console.log("4️⃣ 경기 목록 API 테스트...");
  const matchesResponse = await request("/api/matches");
  test(
    "경기 목록 조회 성공",
    matchesResponse.ok && Array.isArray(matchesResponse.data),
    matchesResponse.ok
      ? `경기 수: ${matchesResponse.data.length}`
      : `Status: ${matchesResponse.status}`
  );

  if (matchesResponse.ok && matchesResponse.data.length > 0) {
    const firstMatch = matchesResponse.data[0];
    test(
      "경기에 clubId 포함",
      "clubId" in firstMatch,
      firstMatch.clubId ? `clubId: ${firstMatch.clubId}` : "clubId가 없습니다"
    );
    test(
      "경기 기본 필드 포함",
      "id" in firstMatch && "date" in firstMatch && "type" in firstMatch,
      "기본 필드 확인 완료"
    );
  }
  console.log("");

  // 5. 출석 목록 테스트
  console.log("5️⃣ 출석 목록 API 테스트...");
  const attendancesResponse = await request("/api/attendances");
  test(
    "출석 목록 조회 성공",
    attendancesResponse.ok && Array.isArray(attendancesResponse.data),
    attendancesResponse.ok
      ? `출석 수: ${attendancesResponse.data.length}`
      : `Status: ${attendancesResponse.status}`
  );
  console.log("");

  // 6. MVP 모드 확인
  console.log("6️⃣ MVP 모드 확인...");
  const multiTenantMode = process.env.MULTI_TENANT_MODE === "true";
  test(
    "MVP 모드 활성화",
    !multiTenantMode,
    `MULTI_TENANT_MODE=${process.env.MULTI_TENANT_MODE || "false"}`
  );

  if (usersResponse.ok && usersResponse.data.length > 0) {
    // MVP 모드에서는 모든 데이터가 반환되어야 함
    const allUsersHaveClubId = usersResponse.data.every((user) => user.clubId);
    test(
      "MVP 모드: 모든 사용자에 clubId 할당됨",
      allUsersHaveClubId,
      allUsersHaveClubId
        ? "모든 사용자에 clubId가 할당되었습니다"
        : "일부 사용자에 clubId가 없습니다"
    );
  }
  console.log("");

  // 최종 결과
  console.log("📊 테스트 결과 요약");
  console.log("=".repeat(50));
  console.log(`✅ 통과: ${results.passed}개`);
  console.log(`❌ 실패: ${results.failed}개`);
  console.log(
    `📈 성공률: ${(
      (results.passed / (results.passed + results.failed)) *
      100
    ).toFixed(1)}%`
  );
  console.log("=".repeat(50));

  if (results.failed > 0) {
    console.log("\n⚠️  실패한 테스트:");
    results.tests
      .filter((t) => t.status === "FAIL")
      .forEach((t) => {
        console.log(`   - ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
  }

  return results.failed === 0;
}

// Node.js에서 fetch를 사용할 수 있도록 확인
if (typeof fetch === "undefined") {
  console.error(
    "❌ fetch가 사용할 수 없습니다. Node.js 18+ 또는 node-fetch 패키지가 필요합니다."
  );
  process.exit(1);
}

testAPI()
  .then((success) => {
    if (success) {
      console.log("\n✅ 모든 API 테스트 통과!");
      process.exit(0);
    } else {
      console.log("\n❌ 일부 API 테스트 실패");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ 테스트 실행 중 오류:", error);
    process.exit(1);
  });
