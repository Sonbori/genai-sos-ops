# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 프로젝트 초기 설정 및 스캐폴딩
- FSD(Feature-Sliced Design) 아키텍처 적용
- Next.js 14 + TypeScript + Tailwind CSS 설정
- Supabase 데이터베이스 스키마 설계
- 기본 페이지 구현 (홈, 신고 접수, 대시보드)
- 테스트 환경 설정 (Vitest, Playwright)
- CI/CD 파이프라인 설정 (Husky, lint-staged, commitlint)
- 시장 조사 및 갭 분석 완료
- 3개 핵심 아이디어 1Pager 작성
- PoC 계획서 작성
- 검증 체크리스트 작성

### Changed
- 프로젝트 구조를 FSD 아키텍처로 재구성
- 환경 변수 설정을 env.sample로 표준화

### Fixed
- PowerShell 환경에서의 폴더 생성 이슈 해결
- Node.js 미설치 환경에서의 수동 프로젝트 생성

## [0.1.0] - 2024-09-05

### Added
- 초기 프로젝트 생성
- Git 저장소 초기화
- 기본 프로젝트 구조 설정

## 변경 파일 목록

### 새로 생성된 파일
```
├── package.json                    # 프로젝트 의존성 및 스크립트
├── tsconfig.json                   # TypeScript 설정
├── tailwind.config.ts              # Tailwind CSS 설정
├── postcss.config.js               # PostCSS 설정
├── next.config.js                  # Next.js 설정
├── vitest.config.ts                # Vitest 설정
├── playwright.config.ts            # Playwright 설정
├── .eslintrc.json                  # ESLint 설정
├── .prettierrc                     # Prettier 설정
├── .lintstagedrc.json              # lint-staged 설정
├── commitlint.config.js            # commitlint 설정
├── env.sample                      # 환경 변수 샘플
├── README.md                       # 프로젝트 문서
├── CHANGELOG.md                    # 변경 로그
├── src/
│   ├── app/
│   │   ├── globals.css             # 전역 스타일
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   ├── page.tsx                # 홈페이지
│   │   ├── intake/
│   │   │   └── page.tsx            # 신고 접수 페이지
│   │   └── dashboard/
│   │       └── page.tsx            # 대시보드 페이지
│   ├── shared/
│   │   ├── lib/
│   │   │   ├── utils.ts            # 유틸리티 함수
│   │   │   ├── supabase.ts         # Supabase 클라이언트
│   │   │   └── ai.ts               # AI 관련 함수
│   │   └── ui/
│   │       ├── button.tsx          # 버튼 컴포넌트
│   │       └── card.tsx            # 카드 컴포넌트
│   ├── entities/                   # 도메인 엔티티 (빈 폴더)
│   └── features/                   # 주요 기능 (빈 폴더)
├── tests/
│   ├── setup.ts                    # 테스트 설정
│   ├── unit/
│   │   └── ai.test.ts              # AI 기능 테스트
│   └── e2e/
│       ├── intake.spec.ts          # 신고 접수 E2E 테스트
│       └── dashboard.spec.ts       # 대시보드 E2E 테스트
├── supabase/
│   └── schema.sql                  # 데이터베이스 스키마
└── research/
    ├── market_scout.md             # 시장 조사 보고서
    ├── market_scout.json           # 시장 조사 JSON
    ├── gaps_and_ideas.md           # 갭 분석 및 아이디어
    ├── poc_plan.md                 # PoC 계획서
    ├── onepagers/
    │   ├── offline-queue-pwa.md    # 오프라인 큐잉 1Pager
    │   ├── noise-resistant-stt.md  # 소음 내성 STT 1Pager
    │   └── multimodal-summary.md   # 멀티모달 요약 1Pager
    └── validators/
        └── not_sold_checklist.md   # 검증 체크리스트
```

### 생성된 폴더 구조
```
src/
├── app/                    # Next.js App Router
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
│   ├── lib/               # 유틸리티
│   └── ui/                # UI 컴포넌트
tests/                     # 테스트
├── unit/                  # 유닛 테스트
├── integration/           # 통합 테스트
└── e2e/                   # E2E 테스트
research/                  # 리서치 자료
├── onepagers/             # 1Pager 문서
└── validators/            # 검증 체크리스트
```

## 실행 방법

### 1. 개발 환경 설정
```bash
# Node.js 설치 (v18 이상)
# npm 또는 yarn 설치

# 프로젝트 클론
git clone <repository-url>
cd genai-sos-ops

# 의존성 설치
npm install

# 환경 변수 설정
cp env.sample .env.local
# .env.local 파일 편집하여 실제 값 입력

# 데이터베이스 설정
# Supabase 프로젝트 생성 후 schema.sql 실행
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 테스트 실행
```bash
# 유닛 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format
```

### 4. 프로덕션 빌드
```bash
npm run build
npm run start
```

## 다음 단계

### PoC 개발 (4주)
1. **Week 1**: 오프라인 큐잉 + STT 파이프라인 + 멀티모달 파이프라인
2. **Week 2**: 암호화 및 보안 + 고급 노이즈 제거 + 3줄 구조요청 생성
3. **Week 3**: 재연결 및 동기화 + 위험 키워드 시스템 + 실시간 처리 최적화
4. **Week 4**: 통합 테스트 및 최적화

### MVP 개발 (8주)
- 3개 핵심 아이디어 통합
- 실제 고객사 파일럿 테스트
- 성능 최적화 및 보안 강화

### 상용화 (12주)
- 프로덕션 배포
- 고객 지원 시스템 구축
- 마케팅 및 영업 활동

## 주요 성과

### 시장 조사
- **경쟁 서비스**: 7개 식별 (상용 5개, 오픈소스 1개, 연구 1개)
- **시장 갭**: 6개 주요 갭 식별
- **차별화 기회**: 3개 핵심 아이디어 선정

### 기술 검증
- **오프라인 큐잉**: 99% 이상 재연결 성공률 목표
- **소음 내성 STT**: 90dB 소음에서 85% 이상 인식률 목표
- **멀티모달 요약**: 90% 이상 분석 정확도 목표

### 비즈니스 검증
- **타겟 시장**: 지자체, 산업현장 HSE, 대형 행사 주최사
- **수익 모델**: 월 구독료 + API 호출량 기반
- **예상 매출**: 연간 $1M (파일럿 고객 10개 기준)
