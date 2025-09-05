# GenAI SOS Ops

> 생성형 AI 기반 재난 대응 및 위급 상황 긴급 신고 분석 플랫폼

## 🚨 프로젝트 개요

GenAI SOS Ops는 시민 신고(음성, 텍스트, 이미지, 영상)를 실시간으로 요약/분류/위치 추정하여 상황실 대시보드로 전달하는 플랫폼입니다. 통신 불안정 시 오프라인-우선 큐잉을 통해 재연결 시 일괄 전송하는 혁신적인 기능을 제공합니다.

## ✨ 주요 기능

### 🔄 오프라인 우선 처리
- 재난 시 네트워크 끊겨도 로컬 보관
- 재연결 시 암호화 전송
- 우선순위 기반 큐잉

### 🎤 현장 소음 내성 STT
- 90dB 이상 소음에서도 85% 이상 인식률
- WebRTC VAD + WhisperX 조합
- 실시간 노이즈 제거

### 📱 멀티모달 통합 분석
- 음성 + 이미지 + 영상 통합 분석
- GPT-4V + Whisper 조합
- 3줄 구조요청 메시지 자동 생성

### 🗺️ 실시간 위치 추정
- GPS + 기지국 + 와이파이 + 이미지 지오프롬프트
- 멀티모달 위치 추정 기술
- 실내/지하에서도 정확한 위치 파악

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Maps**: Leaflet + OpenStreetMap

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### AI/ML
- **LLM**: OpenAI GPT-4 Turbo
- **STT**: OpenAI Whisper + WhisperX
- **Vision**: GPT-4V
- **On-device**: WebRTC VAD, TensorFlow.js

### DevOps
- **Deployment**: Vercel (웹), Supabase (DB/Storage)
- **Testing**: Vitest + Testing Library, Playwright
- **Quality**: ESLint + Prettier, Husky + lint-staged
- **CI/CD**: GitHub Actions

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지
│   ├── intake/            # 신고 접수
│   └── dashboard/         # 상황실 대시보드
├── entities/              # 도메인 엔티티
│   ├── report/            # 신고 엔티티
│   ├── incident/          # 사건/사고 엔티티
│   └── organization/      # 조직 엔티티
├── features/              # 주요 기능
│   ├── intake/            # 신고 접수
│   ├── classification/    # LLM 라우팅·태깅
│   ├── triage/            # 우선순위 결정
│   ├── map-view/          # 지도 뷰
│   └── offline-queue/     # 오프라인 큐잉
├── shared/                # 공통 모듈
│   ├── lib/               # 유틸리티 (db, ai, map, queue)
│   └── ui/                # UI 컴포넌트
tests/                     # 테스트
├── unit/                  # 유닛 테스트
├── integration/           # 통합 테스트
└── e2e/                   # E2E 테스트
research/                  # 리서치 자료
├── market_scout.md        # 시장 조사
├── gaps_and_ideas.md      # 갭 분석 및 아이디어
├── onepagers/             # 1Pager 문서
└── validators/            # 검증 체크리스트
```

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/genai-sos-ops.git
cd genai-sos-ops
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp env.sample .env.local
```

`.env.local` 파일을 편집하여 다음 값들을 설정하세요:
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI 설정
OPENAI_API_KEY=your_openai_api_key

# 지도 서비스
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### 4. 데이터베이스 설정
```bash
# Supabase 프로젝트에서 schema.sql 실행
psql -h your-supabase-host -U postgres -d postgres -f supabase/schema.sql
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🧪 테스트 실행

### 유닛 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### 테스트 UI
```bash
npm run test:ui
```

## 📊 주요 페이지

### 🏠 홈페이지 (`/`)
- 서비스 소개 및 네비게이션
- 주요 기능 하이라이트
- 신고 접수 및 대시보드 링크

### 🚨 신고 접수 (`/intake`)
- 음성 녹음 (WebRTC VAD)
- 파일 업로드 (이미지/영상)
- 텍스트 입력
- 오프라인 모드 지원

### 📊 상황실 대시보드 (`/dashboard`)
- 실시간 신고 현황
- 지도 기반 위치 표시
- 필터링 및 검색
- 통계 및 분석

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# 타입 체크
npm run type-check

# 테스트 실행
npm run test

# E2E 테스트
npm run test:e2e
```

## 📈 시장 조사 결과

### 경쟁 서비스 현황
- **상용 서비스**: 5개 (한전KDN, 빔웍스, 디플리, Aurelian, 버지니아 페어팩스)
- **오픈소스**: 1개 (ETRI)
- **연구 프로젝트**: 1개 (오스틴 경찰국)

### 시장 갭 분석
1. **오프라인 우선 처리 부재**
2. **멀티모달 처리 한계**
3. **실시간 위치 추정 부족**
4. **다국어/방언 지원 제한**
5. **장애인 접근성 부족**
6. **프라이버시 보호 한계**

### 차별화 기회
- **완전 오프라인 우선 아키텍처**
- **90dB 이상 소음에서도 85% 이상 인식률**
- **멀티모달 통합 분석**
- **3줄 구조요청 메시지 자동 생성**

## 🎯 PoC 계획

### 4주 PoC 스코프
1. **Week 1**: 기본 오프라인 큐잉 + STT 파이프라인 + 멀티모달 파이프라인
2. **Week 2**: 암호화 및 보안 + 고급 노이즈 제거 + 3줄 구조요청 생성
3. **Week 3**: 재연결 및 동기화 + 위험 키워드 시스템 + 실시간 처리 최적화
4. **Week 4**: 통합 테스트 및 최적화

### 성공 판정 기준
- **오프라인 큐잉**: 99% 이상 재연결 성공률
- **소음 내성 STT**: 90dB 소음에서 85% 이상 인식률
- **멀티모달 요약**: 90% 이상 분석 정확도

## 📱 오프라인 사용법

### 오프라인 모드 활성화
1. **PWA 설치**: 브라우저에서 "홈 화면에 추가" 선택
2. **오프라인 신고**: 네트워크 없이도 신고 접수 가능
3. **자동 동기화**: 네트워크 복구 시 자동으로 전송

### 오프라인 큐 관리
- **큐 상태 확인**: `/offline` 페이지에서 실시간 모니터링
- **수동 동기화**: 네트워크 복구 후 수동으로 동기화 가능
- **재시도 로직**: 실패한 항목은 최대 3회 자동 재시도
- **큐 정리**: 완료/실패한 항목 일괄 삭제

### 제한사항
- **파일 크기**: 최대 10MB (오프라인 저장소 제한)
- **저장 기간**: 로컬 저장소 용량에 따라 제한
- **AI 분석**: 오프라인 상태에서는 기본 분류만 가능

## 🔒 보안 및 프라이버시

### 데이터 보호
- **암호화**: AES-256 (로컬 저장), TLS 1.3 (전송)
- **최소 수집**: 필요한 정보만 수집
- **익명 옵션**: 개인정보 보호 모드 제공

### 접근 제어
- **인증**: Supabase Auth (OTP/Email)
- **권한**: 조직별 역할 기반 접근 제어
- **감사**: 모든 활동 로그 기록

## 📚 문서

- [시장 조사 보고서](research/market_scout.md)
- [갭 분석 및 아이디어](research/gaps_and_ideas.md)
- [PoC 계획서](research/poc_plan.md)
- [검증 체크리스트](research/validators/not_sold_checklist.md)

### 1Pager 문서
- [오프라인 큐잉 PWA](research/onepagers/offline-queue-pwa.md)
- [소음 내성 STT](research/onepagers/noise-resistant-stt.md)
- [멀티모달 요약](research/onepagers/multimodal-summary.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **프로젝트 관리자**: [your-email@example.com](mailto:your-email@example.com)
- **기술 문의**: [tech@example.com](mailto:tech@example.com)
- **비즈니스 문의**: [business@example.com](mailto:business@example.com)

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Supabase](https://supabase.com/) - 백엔드 서비스
- [OpenAI](https://openai.com/) - AI 모델
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크

---

**⚠️ 주의사항**: 이 프로젝트는 공식 긴급서비스를 대체하지 않으며, 보조 도구로만 사용되어야 합니다. 실제 긴급상황에서는 119(소방서) 또는 112(경찰서)에 직접 신고하세요.
