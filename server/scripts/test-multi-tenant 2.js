/**
 * 멀티 테넌트 모드 테스트 스크립트
 */

import http from 'http';

const API_BASE = 'http://localhost:5001';

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const req = http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testMultiTenant() {
  console.log('🧪 멀티 테넌트 모드 테스트 시작...\n');

  let passed = 0;
  let failed = 0;

  function test(name, condition, details = '') {
    if (condition) {
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
      failed++;
    }
  }

  // 1. 헬스 체크 (클럽 해석 없이)
  console.log('1️⃣ 헬스 체크 테스트...');
  try {
    const result = await makeRequest('/api/health');
    test(
      '헬스 체크 성공',
      result.status === 200 && result.data.status === 'ok',
      `Status: ${result.status}`
    );
  } catch (error) {
    test('헬스 체크 성공', false, `Error: ${error.message}`);
  }
  console.log('');

  // 2. 기본 클럽으로 사용자 목록 조회 (서브도메인 없음)
  console.log('2️⃣ 기본 클럽 테스트 (서브도메인 없음)...');
  try {
    const result = await makeRequest('/api/users');
    test(
      '기본 클럽으로 사용자 조회 성공',
      result.status === 200 && Array.isArray(result.data),
      `사용자 수: ${result.data.length}`
    );
    
    if (result.status === 200 && result.data.length > 0) {
      const firstUser = result.data[0];
      test(
        '사용자에 clubId 포함',
        'clubId' in firstUser && firstUser.clubId,
        `clubId: ${firstUser.clubId}`
      );
      
      // 모든 사용자가 같은 클럽에 속해있는지 확인
      const allSameClub = result.data.every(user => user.clubId === firstUser.clubId);
      test(
        '모든 사용자가 같은 클럽에 속함',
        allSameClub,
        allSameClub ? '데이터 격리 정상' : '다른 클럽의 데이터가 포함됨'
      );
    }
  } catch (error) {
    test('기본 클럽으로 사용자 조회 성공', false, `Error: ${error.message}`);
  }
  console.log('');

  // 3. 헤더로 클럽 지정
  console.log('3️⃣ 헤더로 클럽 지정 테스트...');
  try {
    const result = await makeRequest('/api/users', {
      'X-Club-Subdomain': 'default'
    });
    test(
      '헤더로 클럽 지정 성공',
      result.status === 200 && Array.isArray(result.data),
      `사용자 수: ${result.data.length}`
    );
  } catch (error) {
    test('헤더로 클럽 지정 성공', false, `Error: ${error.message}`);
  }
  console.log('');

  // 4. 쿼리 파라미터로 클럽 지정
  console.log('4️⃣ 쿼리 파라미터로 클럽 지정 테스트...');
  try {
    const result = await makeRequest('/api/users?club=default');
    test(
      '쿼리 파라미터로 클럽 지정 성공',
      result.status === 200 && Array.isArray(result.data),
      `사용자 수: ${result.data.length}`
    );
  } catch (error) {
    test('쿼리 파라미터로 클럽 지정 성공', false, `Error: ${error.message}`);
  }
  console.log('');

  // 5. 존재하지 않는 클럽 테스트
  console.log('5️⃣ 존재하지 않는 클럽 테스트...');
  try {
    const result = await makeRequest('/api/users?club=nonexistent');
    // 존재하지 않는 클럽이면 404 또는 기본 클럽 사용
    if (result.status === 404) {
      test(
        '존재하지 않는 클럽 처리',
        true,
        '404 응답 (예상된 동작)'
      );
    } else if (result.status === 200) {
      // 기본 클럽으로 폴백
      test(
        '존재하지 않는 클럽 처리',
        true,
        '기본 클럽으로 폴백 (예상된 동작)'
      );
    } else {
      test(
        '존재하지 않는 클럽 처리',
        false,
        `예상치 못한 상태 코드: ${result.status}`
      );
    }
  } catch (error) {
    test('존재하지 않는 클럽 처리', false, `Error: ${error.message}`);
  }
  console.log('');

  // 6. 세션 및 경기 데이터 격리 확인
  console.log('6️⃣ 데이터 격리 확인...');
  try {
    const sessionsResult = await makeRequest('/api/sessions');
    const matchesResult = await makeRequest('/api/matches');
    
    test(
      '세션 데이터 조회 성공',
      sessionsResult.status === 200 && Array.isArray(sessionsResult.data),
      `세션 수: ${sessionsResult.data.length}`
    );
    
    test(
      '경기 데이터 조회 성공',
      matchesResult.status === 200 && Array.isArray(matchesResult.data),
      `경기 수: ${matchesResult.data.length}`
    );
    
    if (sessionsResult.status === 200 && sessionsResult.data.length > 0) {
      const allSessionsSameClub = sessionsResult.data.every(
        session => session.clubId === sessionsResult.data[0].clubId
      );
      test(
        '모든 세션이 같은 클럽에 속함',
        allSessionsSameClub,
        '세션 데이터 격리 정상'
      );
    }
    
    if (matchesResult.status === 200 && matchesResult.data.length > 0) {
      const allMatchesSameClub = matchesResult.data.every(
        match => match.clubId === matchesResult.data[0].clubId
      );
      test(
        '모든 경기가 같은 클럽에 속함',
        allMatchesSameClub,
        '경기 데이터 격리 정상'
      );
    }
  } catch (error) {
    test('데이터 격리 확인', false, `Error: ${error.message}`);
  }
  console.log('');

  // 최종 결과
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`📈 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 위의 결과를 확인하세요.');
  } else {
    console.log('\n✅ 모든 멀티 테넌트 테스트 통과!');
  }

  return failed === 0;
}

testMultiTenant()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  });

