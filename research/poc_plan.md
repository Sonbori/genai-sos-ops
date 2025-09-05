# PoC 계획서: GenAI SOS Ops

## PoC 개요
- **기간**: 4주 (2024년 9월 9일 ~ 10월 6일)
- **팀**: 3명 (프론트엔드 1명, 백엔드 1명, AI/ML 1명)
- **예산**: $15,000
- **목표**: 3개 핵심 아이디어의 기술적 실현 가능성 검증

## PoC 공통 기능 (스캐폴딩에 반영)

### 1. 기본 인프라
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Supabase + PostgreSQL
- **AI**: OpenAI API + Whisper
- **배포**: Vercel (웹) + Supabase (DB/Storage)

### 2. 공통 페이지
- **홈페이지** (`/`): 서비스 소개 및 네비게이션
- **신고 접수** (`/intake`): 음성/사진 업로드 → 서버액션 처리
- **대시보드** (`/dashboard`): 맵(클러스터) + 실시간 스트림 + 필터
- **오프라인 모드** (`/offline`): IndexedDB 큐 + 재연결 sync

### 3. 공통 기능
- **인증**: Supabase Auth (OTP/Email)
- **파일 업로드**: Supabase Storage
- **실시간 통신**: Supabase Realtime
- **지도**: Leaflet + OpenStreetMap

## PoC #1: 오프라인 큐잉 PWA + 재연결 배달

### Week 1: 기본 오프라인 큐잉
**목표**: Service Worker + IndexedDB 기반 오프라인 신고 접수

**구현 내용**:
- Service Worker 등록 및 캐싱 전략
- IndexedDB 스키마 설계 (reports, media_files)
- 오프라인 신고 접수 UI
- 기본 암호화 (Web Crypto API)

**성공 기준**:
- [ ] 네트워크 차단 시에도 신고 접수 가능
- [ ] 로컬 저장소에 신고 데이터 저장
- [ ] 기본 암호화 적용

**테스트 시나리오**:
```javascript
// 오프라인 신고 접수 테스트
describe('Offline Report Submission', () => {
  it('should store report locally when offline', async () => {
    // 네트워크 차단
    await page.route('**/*', route => route.abort())
    
    // 신고 접수
    await page.fill('textarea', '테스트 긴급 신고')
    await page.click('button[type="submit"]')
    
    // 로컬 저장 확인
    const reports = await page.evaluate(() => 
      indexedDB.open('sos-reports').result
    )
    expect(reports.length).toBeGreaterThan(0)
  })
})
```

### Week 2: 암호화 및 보안
**목표**: AES-256 암호화 + 디바이스별 키 관리

**구현 내용**:
- AES-256 암호화 구현
- 디바이스별 고유 키 생성
- 키 관리 시스템
- 보안 테스트

**성공 기준**:
- [ ] AES-256 암호화 적용
- [ ] 디바이스별 고유 키 생성
- [ ] 암호화 검증 통과

### Week 3: 재연결 및 동기화
**목표**: 네트워크 복구 시 자동 재연결 + 우선순위 큐잉

**구현 내용**:
- 네트워크 상태 감지
- 자동 재연결 로직
- 우선순위 큐잉 시스템
- 동기화 상태 관리

**성공 기준**:
- [ ] 네트워크 복구 시 자동 재연결
- [ ] 우선순위 기반 전송
- [ ] 99% 이상 재연결 성공률

### Week 4: 통합 테스트 및 최적화
**목표**: 전체 플로우 테스트 + 성능 최적화

**구현 내용**:
- 전체 플로우 테스트
- 성능 최적화
- 사용자 테스트
- 문서화

**성공 기준**:
- [ ] 전체 플로우 정상 작동
- [ ] 5초 이내 신고 접수 완료
- [ ] 사용자 만족도 90% 이상

## PoC #2: 현장 소음 내성 STT 파이프라인

### Week 1: 기본 STT 파이프라인
**목표**: WebRTC VAD + WhisperX 통합

**구현 내용**:
- WebRTC VAD 구현
- WhisperX 통합
- 기본 노이즈 제거
- 실시간 음성 처리

**성공 기준**:
- [ ] WebRTC VAD 정상 작동
- [ ] WhisperX 통합 완료
- [ ] 기본 노이즈 제거 적용

**테스트 시나리오**:
```javascript
// 소음 환경 STT 테스트
describe('Noise-Resistant STT', () => {
  it('should recognize speech in noisy environment', async () => {
    // 90dB 소음 환경 시뮬레이션
    const noiseLevel = 90
    const testAudio = generateNoisyAudio('긴급 신고입니다', noiseLevel)
    
    const result = await sttPipeline.process(testAudio)
    
    expect(result.text).toContain('긴급')
    expect(result.confidence).toBeGreaterThan(0.85)
  })
})
```

### Week 2: 고급 노이즈 제거
**목표**: AI 기반 소음 필터링 + 다중 마이크 지원

**구현 내용**:
- AI 기반 소음 필터링
- 다중 마이크 지원
- 실시간 처리 최적화
- 노이즈 제거 알고리즘

**성공 기준**:
- [ ] AI 기반 소음 필터링 적용
- [ ] 다중 마이크 지원
- [ ] 실시간 처리 최적화

### Week 3: 위험 키워드 시스템
**목표**: 룰 기반 키워드 필터 + LLM 하이브리드 분석

**구현 내용**:
- 룰 기반 키워드 필터
- LLM 하이브리드 분석
- 정확도 향상
- 위험도 자동 판단

**성공 기준**:
- [ ] 위험 키워드 필터 적용
- [ ] LLM 하이브리드 분석
- [ ] 정확도 85% 이상

### Week 4: 현장 테스트 및 최적화
**목표**: 실제 현장 테스트 + 성능 최적화

**구현 내용**:
- 실제 현장 테스트
- 성능 최적화
- 사용자 피드백 반영
- 문서화

**성공 기준**:
- [ ] 실제 현장에서 85% 이상 인식률
- [ ] 3초 이내 처리 완료
- [ ] 현장 작업자 만족도 90% 이상

## PoC #3: 시각+음성 멀티모달 요약

### Week 1: 기본 멀티모달 파이프라인
**목표**: GPT-4V + Whisper 통합

**구현 내용**:
- GPT-4V 통합
- Whisper 통합
- 기본 융합 알고리즘
- 멀티모달 데이터 처리

**성공 기준**:
- [ ] GPT-4V 통합 완료
- [ ] Whisper 통합 완료
- [ ] 기본 융합 알고리즘 적용

**테스트 시나리오**:
```javascript
// 멀티모달 분석 테스트
describe('Multimodal Analysis', () => {
  it('should generate structured report from voice and image', async () => {
    const voiceFile = 'test-voice.wav'
    const imageFile = 'test-image.jpg'
    
    const result = await multimodalPipeline.analyze(voiceFile, imageFile)
    
    expect(result.summary).toHaveLength(3) // 3줄 구조요청
    expect(result.location).toBeDefined()
    expect(result.severity).toMatch(/low|medium|high|critical/)
  })
})
```

### Week 2: 3줄 구조요청 생성
**목표**: 템플릿 기반 메시지 생성 + 상황별 맞춤형 요약

**구현 내용**:
- 템플릿 기반 메시지 생성
- 상황별 맞춤형 요약
- 우선순위 자동 결정
- 구조요청 메시지 최적화

**성공 기준**:
- [ ] 3줄 구조요청 메시지 생성
- [ ] 상황별 맞춤형 요약
- [ ] 우선순위 자동 결정

### Week 3: 실시간 처리 최적화
**목표**: Edge Computing + 캐싱 시스템

**구현 내용**:
- Edge Computing 구현
- 캐싱 시스템 구축
- 성능 최적화
- 실시간 처리 개선

**성공 기준**:
- [ ] Edge Computing 적용
- [ ] 캐싱 시스템 구축
- [ ] 5초 이내 처리 완료

### Week 4: 통합 테스트 및 검증
**목표**: 실제 시나리오 테스트 + 정확도 검증

**구현 내용**:
- 실제 시나리오 테스트
- 정확도 검증
- 사용자 피드백 반영
- 문서화

**성공 기준**:
- [ ] 90% 이상 분석 정확도
- [ ] 95% 이상 관제원 이해도
- [ ] 사용자 만족도 90% 이상

## 테스트 데이터 시드 스크립트

### 시드 데이터 생성
```sql
-- 테스트 조직 데이터
INSERT INTO organizations (name, type, region) VALUES
('서울시 긴급상황관리센터', 'government', '서울특별시'),
('테스트 조직', 'private', '서울특별시');

-- 테스트 사건 데이터
INSERT INTO incidents (organization_id, category, severity, status, title, description) VALUES
('org-1', '화재', 'high', 'active', '건물 화재', '3층에서 연기가 보입니다'),
('org-1', '교통사고', 'medium', 'processing', '차량 충돌', '2차선에서 차량 충돌 사고'),
('org-1', '응급의료', 'critical', 'resolved', '의식 잃은 환자', '지하철역에서 의식 잃은 환자 발견');

-- 테스트 신고 데이터
INSERT INTO reports (incident_id, organization_id, type, content, confidence_score) VALUES
('incident-1', 'org-1', 'voice', '건물에서 연기가 나고 있어요', 0.9),
('incident-2', 'org-1', 'multimodal', '차가 부딪혔어요', 0.8),
('incident-3', 'org-1', 'text', '사람이 쓰러져서 의식을 잃었습니다', 0.95);
```

### E2E 시나리오
```javascript
// E2E 테스트 시나리오
describe('GenAI SOS Ops E2E', () => {
  it('should handle complete emergency report flow', async () => {
    // 1. 홈페이지 접속
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('GenAI SOS Ops')
    
    // 2. 신고 접수 페이지로 이동
    await page.click('a[href="/intake"]')
    await expect(page.locator('h1')).toContainText('긴급 신고 접수')
    
    // 3. 음성 녹음
    await page.click('button:has-text("음성 녹음 시작")')
    await page.waitForTimeout(3000) // 3초 녹음
    await page.click('button:has-text("녹음 중지")')
    
    // 4. 이미지 업로드
    await page.setInputFiles('input[type="file"]', 'test-image.jpg')
    
    // 5. 텍스트 입력
    await page.fill('textarea', '테스트 긴급 신고입니다')
    
    // 6. 신고 제출
    await page.click('button:has-text("긴급 신고 제출")')
    
    // 7. 대시보드에서 확인
    await page.goto('/dashboard')
    await expect(page.locator('text=테스트 긴급 신고')).toBeVisible()
  })
})
```

## 성공 판정 기준

### 기술적 성공 기준
1. **오프라인 큐잉**: 99% 이상 재연결 성공률
2. **소음 내성 STT**: 90dB 소음에서 85% 이상 인식률
3. **멀티모달 요약**: 90% 이상 분석 정확도

### 비즈니스 성공 기준
1. **사용자 만족도**: 90% 이상
2. **처리 시간**: 5초 이내
3. **시스템 안정성**: 99% 이상 가용성

### PoC 완료 후 다음 단계
1. **MVP 개발**: 8주 (3개 아이디어 통합)
2. **파일럿 테스트**: 4주 (실제 고객사 테스트)
3. **상용화**: 12주 (프로덕션 배포)

## 리스크 관리

### 기술적 리스크
- **AI API 제한**: 대체 모델 준비 (Azure OpenAI, Claude)
- **성능 이슈**: Edge Computing + 캐싱으로 해결
- **보안 취약점**: 정기 보안 감사 + 침투 테스트

### 비즈니스 리스크
- **규제 변경**: 법무팀과 협력하여 대응
- **경쟁사 진입**: 차별화 포인트 강화
- **시장 수요 부족**: 파일럿 테스트로 검증

이 PoC 계획을 통해 3개 핵심 아이디어의 기술적 실현 가능성을 검증하고, 상용화를 위한 기반을 마련할 수 있습니다.
