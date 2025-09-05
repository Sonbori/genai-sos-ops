'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

export default function IntakePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)
    // TODO: WebRTC VAD 구현
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleSubmit = async () => {
    try {
      // 위치 정보 가져오기
      let lat: number | undefined
      let lng: number | undefined
      
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          })
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
      }

      // 오프라인 큐에 추가
      const { offlineQueue } = await import('@/features/offline-queue/lib/offlineQueue')
      
      const queueId = await offlineQueue.enqueue({
        type: uploadedFiles.length > 0 ? 'multimodal' : 'text',
        files: uploadedFiles,
        transcript: isRecording ? '음성 녹음됨' : undefined,
        lang: 'ko',
        lat,
        lng,
        createdAt: new Date().toISOString(),
      })

      console.log('신고가 큐에 추가되었습니다:', queueId)
      
      // 성공 메시지 표시
      alert('신고가 접수되었습니다. 네트워크가 연결되면 자동으로 전송됩니다.')
      
      // 폼 초기화
      setUploadedFiles([])
      setIsRecording(false)
      
    } catch (error) {
      console.error('신고 제출 실패:', error)
      alert('신고 제출에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">
          🚨 긴급 신고 접수
        </h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">음성 신고</h2>
          <Button 
            onClick={handleVoiceRecord}
            className={`w-full ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            {isRecording ? '⏹️ 녹음 중지' : '🎤 음성 녹음 시작'}
          </Button>
          {isRecording && (
            <p className="text-center text-sm text-gray-600 mt-2">
              녹음 중... 최대 5분까지 가능합니다.
            </p>
          )}
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">파일 업로드</h2>
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded"
          />
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">업로드된 파일:</h3>
              <ul className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    📎 {file.name} ({Math.round(file.size / 1024)}KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">텍스트 신고</h2>
          <textarea
            placeholder="상황을 자세히 설명해주세요..."
            className="w-full h-32 p-3 border rounded resize-none"
          />
        </Card>

        <div className="text-center">
          <Button 
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
          >
            🚨 긴급 신고 제출
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            제출된 신고는 AI가 자동으로 분석하여 상황실로 전달됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
