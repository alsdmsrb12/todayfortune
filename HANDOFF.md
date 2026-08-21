# 오늘의 운세 (myfortunetoday.com) — 인수인계 문서

Claude Code로 옮겨서 이어받을 때 참고하세요. 이 문서는 지금까지 Cowork(웹/데스크탑 대화)에서 작업한 내용을 정리한 것입니다.

## 프로젝트 개요

- 이름: 오늘의 운세 (Today's Fortune)
- 도메인: myfortunetoday.com (Cloudflare 등록, DNS 연결 완료)
- 배포: GitHub 저장소 → Vercel 자동 배포 (Vercel 프로젝트 이미 연결됨)
- 형태: 단일 HTML 파일(index.html) 기반 바닐라 JS 웹앱 + Vercel 서버리스 함수 1개(api/fortune.js)
- 언어: 전부 한국어, 사용자(사업주)도 한국어로 소통

## 폴더 구조 (그대로 GitHub 저장소 루트에 있어야 함)

```
/
├── index.html                              # 메인 앱 (전체 UI + 로직, 단일 파일)
├── api/
│   └── fortune.js                          # Vercel 서버리스 함수 (Claude API 프록시)
├── package.json
├── README.md                               # 배포 가이드 (구버전, 참고용)
├── robots.txt
├── sitemap.xml
├── ads.txt                                 # 구글 애드센스 인증
├── og-image.jpg                            # 카카오톡/SNS 공유 미리보기 이미지 (1200x630)
├── favicon.ico
├── favicon-16.png / favicon-32.png / favicon-48.png / favicon-192.png / favicon-512.png
├── apple-touch-icon.png
└── naver915cd6c94eaf578b4b767dfac68fb40b.html   # 네이버 서치어드바이저 소유확인 파일
```

**중요**: 위 파일들은 전부 저장소 루트에 있어야 합니다 (api/fortune.js만 api/ 폴더 안). 예전에 GitHub 웹 업로드 중 fortune.js가 루트에 잘못 올라갔던 적이 있으니, 옮길 때 폴더 구조 다시 확인하세요.

## 아키텍처 핵심

1. **클라이언트(index.html)는 Anthropic API를 직접 호출하지 않습니다.** `/api/fortune`으로 POST 요청을 보내면, 서버리스 함수(`api/fortune.js`)가 `process.env.ANTHROPIC_API_KEY`를 사용해 대신 Claude API를 호출합니다. (API 키를 클라이언트에 노출하지 않기 위함 — 원본 코드는 이 부분이 안전하지 않아서 초기에 고친 부분입니다.)
2. Vercel 프로젝트 설정 > Environment Variables에 `ANTHROPIC_API_KEY`가 등록되어 있어야 정상 동작합니다.
3. 클라이언트 상태는 전부 `localStorage` 사용 (원본은 `window.storage`라는 비표준 API를 썼었음, 이것도 고쳐진 부분).

## 3가지 콘텐츠 탭

1. **이름으로 보기 (개인 운세)**: 이름+생년월일+성별 입력 → `/api/fortune` 호출 → Claude가 JSON으로 운세 반환. 하루 최대 2회 무료 생성 제한 (`PERSONAL_DAILY_LIMIT`, localStorage `personalFortuneCount:YYYY-MM-DD`). 같은 이름/생년월일 재조회는 캐시되어 무제한.
2. **캡슐 뽑기**: 랜덤 문구 뽑기 (AI 호출 없음, 로컬 `CAPSULE_FORTUNES` 배열에서 랜덤 선택). 500원 결제 예정이지만 **아직 실제 결제 연동 안 됨 (TEST 상태, 무제한 무료)**.
3. **타로카드**: 메이저 아르카나 22장 × 정/역방향 = 44개 카드. 카드를 뽑으면 이번에 추가한 "카드 이미지"(로마숫자+한자 모티프, 역방향이면 180도 회전) + 상징 의미 + 오늘의 운세 텍스트가 나옴. 이것도 500원 예정이지만 **아직 미연동, 무제한 무료**.

두 유료 콘텐츠 모두 "공유하면 무료 뽑기 1회 적립" 기능이 있음 (`freeCapsuleDraws`, `freeCapsuleRewardDate` localStorage, 캡슐/타로 공용, 하루 1회 자정 초기화). 하지만 **현재 결제 자체가 없어서 이 무료뽑기 카운터는 사실상 장식 — 무료 횟수가 0이어도 뽑기는 항상 진행됨.** 사용자(사업주)에게 이미 이 사실 안내했고, 실제 결제(포트원) 연동 시점에 맞춰 결제 모달을 만들기로 합의됨 (아직 미착수).

## 현재 상태 / 완료된 것

- 도메인, DNS, Vercel 배포 파이프라인: 완료, 실제 라이브 사이트(myfortunetoday.com)에서 정상 동작 확인됨
- 사업자등록: 완료 (상호: 오늘의운세, 사업자등록번호: 878-29-01946)
- 이용약관/개인정보처리방침: 실제 사업자 정보 반영 완료, 환불정책(전자상거래법 제17조 제2항 인용) 포함
- SEO 기초: meta description, canonical, robots.txt, sitemap.xml, 파비콘 세트, og:image/twitter:image (1200x630 jpg) 전부 준비됨
- 네이버 서치어드바이저 소유확인 파일 준비됨 (사용자가 아직 등록 절차를 안 밟음, "나중에 하겠다"고 함)
- 구글 애드센스 인증 3종(메타태그, adsbygoogle 스크립트, ads.txt) 적용됨 — 실제 광고 심사/배치는 아직
- 연속 방문 스트릭 기능 추가 (하루 걸러 방문 시 리셋, localStorage `visitStreak`/`lastVisitDate`)
- 타로카드 결과에 "카드 이미지"(로마숫자+한자, 역방향 시 180도 회전) + 카드 상징 의미 추가
- iOS Safari 이미지 저장 문제 해결 (`isIOSSafari()` + `saveOrOpenBlob()` — iOS Safari는 `<a download>`가 안 먹혀서 새 탭에서 열고 "길게 눌러 저장" 안내)
- `[hidden]` 속성이 같은 요소의 class `display` 규칙에 밀리는 CSS 버그 여러 건 수정 (`.selector[hidden]{display:none}` 명시적으로 추가하는 패턴, 이 코드베이스에서 반복되는 버그 유형이니 새 UI 요소 추가 시 주의)

## 아직 안 된 것 / 다음 작업 후보

1. **포트원(PortOne) 실제 결제 연동** — 가장 중요. 지금 캡슐/타로 버튼은 결제 없이 바로 뽑기가 진행됨. 사용자는 "토스페이먼츠보다 포트원으로 하겠다"고 이미 결정함. 연동 시 `drawCapsule()`, `tarotStartBtn` 클릭 핸들러에 실제 결제 승인 흐름을 끼워넣어야 함 (현재는 `usedFreeDraw` 체크만 있고 결제 게이트가 없음).
2. **통신판매업 신고** — PG(포트원) 가입 후 발급되는 "구매안전서비스 이용확인증"이 있어야 신청 가능. 아직 미착수.
3. **서버 사이드 요청 제한 (rate limiting)** — `api/fortune.js`에 사용량 제한이 전혀 없음. 지금 클라이언트 쪽 하루 2회 제한은 localStorage 기반이라 시크릿 모드로 우회 가능. 트래픽 늘면 Upstash 같은 걸로 IP 기준 서버 사이드 제한을 걸 것을 권장(사용자에게도 안내함, 아직 요청 안 받음).
4. **네이버 서치어드바이저 등록** — 파일은 준비됨, 사용자가 실제 절차는 아직 안 밟음.
5. **구글 서치 콘솔 등록** — 아직 미착수 (meta description/sitemap은 준비됨).
6. **애드센스 실제 심사 신청 + 광고 유닛 배치** — 인증 코드만 넣어둔 상태.
7. (아이디어 차원, 요청받은 건 아님) 재방문 유도 강화: 카카오톡 알림 채널/브라우저 푸시 같은 것.

## 알아두면 좋은 반복 이슈

- **JSON 파싱 에러 재현**: 대화창 미리보기(SendUserFile display:render)로 index.html을 열면 `/api/fortune` 백엔드가 없어서 404 HTML이 오고, 그걸 JSON으로 파싱하려다 에러가 남. 실제 배포 사이트에서는 발생 안 함 — 버그 아님. 로컬 테스트 시 `mock_server.py` 같은 걸로 `/api/fortune`을 스텁 처리해서 테스트했음 (이 프로젝트 폴더엔 포함 안 시켰음, 필요하면 요청하세요).
- **사용자(사업주) 톤**: 항상 "냉정하게" 솔직한 피드백을 원함, 좋은 말만 하지 말 것. 비용은 최대한 아끼되 필요하면 유료도 수용함. 진행 상황을 세세히 알려주는 걸 선호함.

## 연락처 정보 (이미 코드에 반영됨, 참고용)

- 상호: 오늘의운세 · 대표: 민은규
- 사업자등록번호: 878-29-01946 · 통신판매업 신고번호: 신고 진행 중
- 사업장 소재지: 경상남도 산청군 금서면 친환경로 2563-31
- 전화: 070-4544-7694 · 이메일: alsdmsrb12@gmail.com
