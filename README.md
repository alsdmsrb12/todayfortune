# 오늘의 운세 배포 가이드

## 폴더 구성
- `index.html` — 사이트 본체 (원본에서 API 호출/저장 방식만 배포 가능하게 수정함)
- `api/fortune.js` — 운세 생성을 대신 처리하는 서버리스 함수 (API 키를 안전하게 보관)
- `package.json` — 프로젝트 메타데이터

## 1) Anthropic API 키 발급
1. https://console.anthropic.com 가입/로그인 (claude.ai 계정과 별개로 API 과금이 발생합니다)
2. API Keys 메뉴에서 새 키 생성
3. 결제 수단 등록 (약간의 크레딧 충전 필요)

## 2) Vercel로 배포
1. https://vercel.com 가입 (GitHub 계정으로 가입하면 편함)
2. 이 폴더를 GitHub 저장소에 올리기, 또는 Vercel CLI 사용:
   ```
   npm i -g vercel
   cd todayfortune
   vercel
   ```
3. Vercel 프로젝트 설정 > Settings > Environment Variables 에서
   `ANTHROPIC_API_KEY` = (1번에서 발급한 키) 등록 후 재배포(Redeploy)
4. 배포되면 `xxxx.vercel.app` 주소로 바로 접속 확인 가능

## 3) 도메인 구매 및 연결
1. 원하는 도메인을 등록업체에서 구매 (가비아/후이즈: .kr, .co.kr / Namecheap/Cloudflare: .com 추천)
2. Vercel 프로젝트 > Settings > Domains 에서 구매한 도메인 추가
3. Vercel이 안내하는 DNS 레코드(보통 A 레코드 또는 CNAME)를 도메인 등록업체의 DNS 설정에 입력
4. 전파까지 몇 분~몇 시간 소요, 이후 자체 도메인으로 접속 가능

## 참고 — 아직 남은 작업
- **캡슐 뽑기(500원) 결제**: 현재는 UI만 있고 실제 결제 연동 안 됨. 실제 서비스로 운영하려면 토스페이먼츠, 카카오페이 등 PG 연동이 필요하고, 통신판매업 신고도 필요합니다.
- **개인정보처리방침/이용약관**: 초안 상태. 사업자 정보(상호, 사업자등록번호 등)를 실제로 등록 후 채워 넣어야 합니다.
