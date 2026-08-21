// Upstash Redis REST API 헬퍼 (SDK 의존성 없이 fetch만 사용)
// Vercel 프로젝트 설정 > Environment Variables 에 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 을 등록해야 동작합니다.
// (https://upstash.com 에서 무료 Redis 데이터베이스를 만들면 두 값을 바로 확인할 수 있습니다.)
// 두 값이 없으면 모든 함수가 null을 반환하며, 호출부에서 이를 "기능 비활성화"로 처리해 사이트가 죽지 않도록 합니다.

const BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function call(path) {
  if (!BASE || !TOKEN) return null;
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.result;
  } catch (e) {
    return null;
  }
}

export async function redisGet(key) {
  return call(`/get/${encodeURIComponent(key)}`);
}

export async function redisSetEx(key, value, ttlSeconds) {
  return call(`/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSeconds}`);
}

// 키가 없으면 1로 시작하는 카운터를 늘리고, 최초 생성 시에만 TTL을 건다 (일별 rate limit용)
export async function redisIncrWithExpire(key, ttlSeconds) {
  const count = await call(`/incr/${encodeURIComponent(key)}`);
  if (count === 1) {
    await call(`/expire/${encodeURIComponent(key)}/${ttlSeconds}`);
  }
  return count; // Upstash 미설정 시 null 반환 -> 호출부에서 제한 미적용으로 처리
}

// SET ... NX를 이용한 원자적 1회성 선점 (get-then-set은 두 요청이 동시에 들어오면 둘 다 통과하는 race condition이 있어서 사용하지 않음)
// 반환값: 'claimed' (이번 호출이 최초 선점 성공) | 'already-claimed' (이미 선점됨) | 'not-configured' (Upstash 미설정, 호출부에서 체크 자체를 건너뛰어야 함)
export async function claimOnce(key, ttlSeconds) {
  if (!BASE || !TOKEN) return 'not-configured';
  const result = await call(`/set/${encodeURIComponent(key)}/1?EX=${ttlSeconds}&NX=true`);
  return result === 'OK' ? 'claimed' : 'already-claimed';
}
