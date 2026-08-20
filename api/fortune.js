// Vercel Serverless Function
// 배포 시 Vercel 프로젝트 설정 > Environment Variables 에 ANTHROPIC_API_KEY 를 등록해야 합니다.
// (Anthropic API 키는 https://console.anthropic.com 에서 발급받습니다. Claude.ai 구독과는 별개의 유료 API 과금입니다.)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, birth, gender, fixedScore } = req.body || {};

  if (!name || !birth || !fixedScore) {
    res.status(400).json({ error: '필수 값이 누락되었습니다.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const randomSeed = Math.floor(Math.random() * 999999);

  const system = "당신은 한국 전통 사주와 오늘의 운세를 봐주는 다정하고 신비로운 도사입니다. 사용자의 이름, 생년월일, (있다면) 성별, 오늘 날짜, 그리고 이미 확정된 총운 점수를 참고하여 오늘 하루의 운세를 만들어주세요. 성별 정보가 있으면 애정운이나 조언의 표현을 자연스럽게만 반영하고, 없으면 중립적인 표현을 쓰세요. 반드시 아래 JSON 스키마 형식의 순수 JSON 객체 하나만 출력하세요. 코드블록(```), 설명, 인사말 등 어떤 추가 텍스트도 포함하지 마세요.\n\n스키마:\n{\n  \"greetLine\": \"이름을 부르며 건네는 짧은 한 줄 인사 (10자 내외)\",\n  \"totalScore\": 전달받은 점수를 그대로 정수로 넣을 것,\n  \"totalTitle\": \"전달받은 점수 수준에 어울리는 네 글자 내외 제목 (예: 순풍만범, 은은한빛, 잔잔한하루)\",\n  \"totalText\": \"전달받은 점수 수준에 맞는 총운 설명 1~2문장\",\n  \"loveText\": \"애정운 1문장\",\n  \"wealthText\": \"재물운 1문장\",\n  \"luckyColorName\": \"행운의 색 이름 (한글, 예: 은은한 남색)\",\n  \"luckyColorHex\": \"해당 색의 hex 코드 (예: #3C4E5C)\",\n  \"luckyItem\": \"행운의 아이템 (짧은 명사구)\",\n  \"luckyNumber\": 1~99 사이 정수,\n  \"advice\": \"오늘 하루를 위한 조언 한마디, 따뜻하고 임팩트있게 1문장\"\n}\n\n중요: totalScore는 이미 정해져서 전달됩니다. 당신은 그 숫자를 절대 바꾸지 말고 그대로 사용하며, 나머지 문구들이 그 점수 수준과 자연스럽게 어울리도록 작성하는 역할만 합니다.\n\n문구 톤 가이드(반드시 따르세요):\n- 점수가 낮더라도 totalText, loveText, wealthText, advice는 절대 무섭거나 절망적인 표현을 쓰지 마세요. \"조심하세요\", \"천천히 가도 괜찮아요\", \"오늘은 잠시 숨 고르는 날\" 같이 담담하고 다독이는 톤을 유지하세요.\n- 재앙, 사고, 큰 손실, 인간관계 파탄 등 구체적으로 불안을 조장하는 소재는 점수와 무관하게 절대 쓰지 마세요.\n- 낮은 점수여도 마지막엔 작은 희망이나 다음 기회를 암시하는 문장으로 마무리하세요.";

  const user = `이름: ${name}\n생년월일: ${birth}\n성별: ${gender || '미입력'}\n오늘 날짜: ${today}\n확정된 총운 점수: ${fixedScore}\n난수 시드(문구 변주용): ${randomSeed}\n위 정보를 바탕으로, totalScore는 반드시 ${fixedScore}로 고정한 채 나머지 문구를 JSON으로 작성해줘.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.type === 'error') {
      const msg = data.error && data.error.message ? data.error.message : `HTTP ${response.status}`;
      res.status(502).json({ error: msg });
      return;
    }

    const raw = (data.content || []).map((b) => b.text || '').join('');
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      res.status(502).json({ error: 'AI 응답에서 JSON을 찾지 못했습니다.' });
      return;
    }

    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    parsed.totalScore = fixedScore;
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
