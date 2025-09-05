import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeReport, transcribeAudio, extractLocation } from '@/shared/lib/ai'

describe('AI 분석 기능', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeReport', () => {
    it('화재 신고를 올바르게 분류해야 함', async () => {
      const result = await analyzeReport('건물에서 연기가 나고 있어요! 3층에서 불이 보입니다.')
      
      expect(result.category).toBe('화재')
      expect(result.severity).toBe('high')
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.urgency_score).toBeGreaterThan(70)
    })

    it('교통사고 신고를 올바르게 분류해야 함', async () => {
      const result = await analyzeReport('강남대로에서 차량 충돌 사고가 발생했습니다.')
      
      expect(result.category).toBe('교통사고')
      expect(result.severity).toBe('medium')
      expect(result.location_hints).toContain('강남대로')
    })

    it('응급의료 신고를 올바르게 분류해야 함', async () => {
      const result = await analyzeReport('사람이 쓰러져서 의식을 잃었습니다. 구급차가 필요해요!')
      
      expect(result.category).toBe('응급의료')
      expect(result.severity).toBe('critical')
      expect(result.urgency_score).toBeGreaterThan(90)
    })

    it('AI 분석 실패 시 기본값을 반환해야 함', async () => {
      // OpenAI 모킹을 실패하도록 설정
      const mockOpenAI = vi.mocked(await import('openai'))
      mockOpenAI.default = vi.fn(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }))

      const result = await analyzeReport('테스트 신고')
      
      expect(result.category).toBe('기타')
      expect(result.severity).toBe('medium')
      expect(result.confidence).toBe(0.5)
    })
  })

  describe('extractLocation', () => {
    it('위치 정보를 올바르게 추출해야 함', async () => {
      const result = await extractLocation('서울시 강남구 테헤란로 123번지에서 사고가 발생했습니다.')
      
      expect(result.location_name).toContain('강남구')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('위치 정보가 없을 때 null을 반환해야 함', async () => {
      const result = await extractLocation('사고가 발생했습니다.')
      
      expect(result.location_name).toBeNull()
      expect(result.confidence).toBeLessThan(0.5)
    })
  })

  describe('transcribeAudio', () => {
    it('음성 파일을 텍스트로 변환해야 함', async () => {
      const mockFile = new File(['test audio'], 'test.wav', { type: 'audio/wav' })
      
      const result = await transcribeAudio(mockFile)
      
      expect(result.text).toBeDefined()
      expect(result.language).toBe('ko')
      expect(result.confidence).toBeGreaterThan(0)
    })
  })
})
