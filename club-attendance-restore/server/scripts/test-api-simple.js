/**
 * 간단한 API 테스트 스크립트 (Node.js 내장 모듈 사용)
 */

import http from 'http';

const API_BASE = 'http://localhost:3001';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const req = http.get(url, (res) => {
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

async function testAPI() {
  console.log('🧪 API 테스트 시작...\n');

  const tests = [
    { name: '헬스 체크', path: '/api/health' },
    { name: '사용자 목록', path: '/api/users' },
    { name: '세션 목록', path: '/api/sessions' },
    { name: '경기 목록', path: '/api/matches' },
    { name: '출석 목록', path: '/api/attendances' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📡 ${test.name} 테스트 중...`);
      const result = await makeRequest(test.path);
      
      if (result.status === 200) {
        if (Array.isArray(result.data)) {
          const hasClubId = result.data.length > 0 && 'clubId' in result.data[0];
          console.log(`   ✅ 성공: ${result.data.length}개 조회`);
          if (hasClubId) {
            console.log(`   ✅ clubId 필드 포함됨`);
          }
          passed++;
        } else if (result.data.status === 'ok') {
          console.log(`   ✅ 성공: ${JSON.stringify(result.data)}`);
          passed++;
        } else {
          console.log(`   ⚠️  응답: ${JSON.stringify(result.data).substring(0, 100)}`);
          passed++;
        }
      } else {
        console.log(`   ❌ 실패: Status ${result.status}`);
        console.log(`   응답: ${JSON.stringify(result.data).substring(0, 200)}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`📈 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  return failed === 0;
}

testAPI()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  });

