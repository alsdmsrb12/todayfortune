// Vercel Serverless Function — 포트원(PortOne) 결제 서버 사이드 검증
// 클라이언트가 PortOne.requestPayment()로 결제를 마친 뒤 paymentId를 이 엔드포인트로 보내면,
// 포트원 서버에 직접 조회해서 "진짜로 결제 완료됐는지 + 금액이 맞는지"를 확인하고,
// 같은 결제 건이 두 번 이상 사용(뽑기 재사용)되지 않도록 Upstash에 사용 기록을 남깁니다.
//
// 배포 시 Vercel 프로젝트 설정 > Environment Variables 에 PORTONE_API_SECRET 을 등록해야 합니다.
// (포트원 관리자콘솔 admin.portone.io > API Keys(V2) 메뉴에서 확인)

import { redisGet, redisSetEx } from './_upstash.js';

const DRAW_PRICE = 500;
const USED_PAYMENT_TTL_SECONDS = 60 * 60 * 24; // 하루면 재사용 방지 목적으로 충분

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { paymentId } = req.body || {};
  if (!paymentId) {
    res.status(400).json({ error: 'paymentId가 누락되었습니다.' });
    return;
  }

  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    res.status(500).json({ error: '서버에 PORTONE_API_SECRET이 설정되어 있지 않습니다.' });
    return;
  }

  try {
    const alreadyUsed = await redisGet(`payment:used:${paymentId}`);
    if (alreadyUsed) {
      res.status(409).json({ error: '이미 처리된 결제입니다.' });
      return;
    }

    const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${secret}` }
    });
    const data = await portoneRes.json();

    if (!portoneRes.ok) {
      res.status(502).json({ error: data.message || '포트원 결제 조회에 실패했습니다.' });
      return;
    }

    if (data.status !== 'PAID') {
      res.status(402).json({ error: '결제가 완료되지 않았습니다.' });
      return;
    }

    const paidAmount = data.amount && data.amount.total;
    if (paidAmount !== DRAW_PRICE) {
      res.status(402).json({ error: '결제 금액이 일치하지 않습니다.' });
      return;
    }

    // Upstash 미설정 시(null 반환) 재사용 방지 기록은 건너뛰지만, 결제 자체 검증은 통과시킴
    await redisSetEx(`payment:used:${paymentId}`, '1', USED_PAYMENT_TTL_SECONDS);

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
