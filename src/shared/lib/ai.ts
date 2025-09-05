import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIAnalysisResult {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  confidence: number
  location_hints: string[]
  keywords: string[]
  urgency_score: number
}

export interface STTResult {
  text: string
  confidence: number
  language: string
  duration: number
}

// 음성을 텍스트로 변환
export async function transcribeAudio(audioFile: File): Promise<STTResult> {
  try {
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')
    formData.append('language', 'ko') // 한국어 우선

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    const result = await response.json()
    
    return {
      text: result.text,
      confidence: 0.9, // Whisper는 confidence를 직접 제공하지 않음
      language: result.language || 'ko',
      duration: audioFile.size / 16000, // 대략적인 추정
    }
  } catch (error) {
    console.error('STT 오류:', error)
    throw new Error('음성 인식에 실패했습니다.')
  }
}

// 텍스트를 분석하여 신고 분류
export async function analyzeReport(
  text: string,
  mediaType?: string
): Promise<AIAnalysisResult> {
  try {
    const prompt = `
다음은 긴급 신고 내용입니다. 이를 분석하여 분류해주세요.

신고 내용: "${text}"
미디어 타입: ${mediaType || '텍스트'}

다음 형식으로 JSON 응답해주세요:
{
  "category": "화재|교통사고|응급의료|자연재해|범죄|기타",
  "severity": "low|medium|high|critical",
  "summary": "3줄 이내 요약",
  "confidence": 0.0-1.0,
  "location_hints": ["위치 관련 키워드 배열"],
  "keywords": ["중요 키워드 배열"],
  "urgency_score": 0-100
}

분류 기준:
- critical: 생명 위험, 대규모 재해
- high: 응급상황, 즉시 대응 필요
- medium: 신속한 대응 필요
- low: 일반적인 신고
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 긴급상황 분석 전문가입니다. 신고 내용을 정확히 분석하고 분류해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    })

    const result = completion.choices[0]?.message?.content
    if (!result) {
      throw new Error('AI 분석 결과를 받을 수 없습니다.')
    }

    return JSON.parse(result)
  } catch (error) {
    console.error('AI 분석 오류:', error)
    // 기본값 반환
    return {
      category: '기타',
      severity: 'medium',
      summary: text.substring(0, 100) + '...',
      confidence: 0.5,
      location_hints: [],
      keywords: [],
      urgency_score: 50,
    }
  }
}

// 이미지 분석 (Vision API)
export async function analyzeImage(imageFile: File): Promise<{
  description: string
  objects: string[]
  emergency_indicators: string[]
}> {
  try {
    const base64 = await fileToBase64(imageFile)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '이 이미지를 분석하여 긴급상황 여부를 판단해주세요. 화재, 사고, 부상, 위험 상황 등을 찾아주세요.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageFile.type};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    })

    const result = completion.choices[0]?.message?.content || ''
    
    return {
      description: result,
      objects: extractObjects(result),
      emergency_indicators: extractEmergencyIndicators(result),
    }
  } catch (error) {
    console.error('이미지 분석 오류:', error)
    return {
      description: '이미지 분석에 실패했습니다.',
      objects: [],
      emergency_indicators: [],
    }
  }
}

// 파일을 Base64로 변환
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = error => reject(error)
  })
}

// 텍스트에서 객체 추출
function extractObjects(text: string): string[] {
  const objects = []
  const objectKeywords = ['차량', '건물', '사람', '불', '연기', '물', '도로', '교통', '의료진', '구급차']
  
  for (const keyword of objectKeywords) {
    if (text.includes(keyword)) {
      objects.push(keyword)
    }
  }
  
  return objects
}

// 텍스트에서 긴급상황 지표 추출
function extractEmergencyIndicators(text: string): string[] {
  const indicators = []
  const emergencyKeywords = ['화재', '사고', '부상', '응급', '위험', '구조', '119', '112', '긴급']
  
  for (const keyword of emergencyKeywords) {
    if (text.includes(keyword)) {
      indicators.push(keyword)
    }
  }
  
  return indicators
}

// 위치 정보 추출
export async function extractLocation(text: string): Promise<{
  location_name: string | null
  coordinates: { lat: number; lng: number } | null
  confidence: number
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 위치 정보 추출 전문가입니다. 텍스트에서 한국의 구체적인 위치 정보를 찾아주세요.'
        },
        {
          role: 'user',
          content: `다음 텍스트에서 위치 정보를 추출해주세요: "${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
    })

    const result = completion.choices[0]?.message?.content || ''
    
    // 간단한 위치명 추출 (실제로는 더 정교한 파싱 필요)
    const locationMatch = result.match(/([가-힣]+(?:시|구|동|로|길))/)
    const location_name = locationMatch ? locationMatch[1] : null
    
    return {
      location_name,
      coordinates: null, // 실제로는 지오코딩 API 사용
      confidence: location_name ? 0.8 : 0.2,
    }
  } catch (error) {
    console.error('위치 추출 오류:', error)
    return {
      location_name: null,
      coordinates: null,
      confidence: 0,
    }
  }
}
