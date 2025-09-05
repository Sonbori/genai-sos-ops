'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { offlineQueue, QueueItem, QueueStatus } from '@/features/offline-queue/lib/offlineQueue'
import { NetworkUtils } from '@/shared/lib/idb'

export default function OfflinePage() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // 초기화
    offlineQueue.init()
    updateStatus()

    // 네트워크 상태 감지
    const unsubscribe = NetworkUtils.onNetworkChange((online) => {
      setIsOnline(online)
      if (online) {
        updateStatus()
      }
    })

    // 5초마다 상태 업데이트
    const interval = setInterval(updateStatus, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const updateStatus = async () => {
    try {
      const status = await offlineQueue.getStatus()
      const items = await offlineQueue.getAllItems()
      
      setQueueStatus(status)
      setQueueItems(items)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleSync = async () => {
    setSyncInProgress(true)
    try {
      const result = await offlineQueue.sync()
      setLastSync(new Date())
      
      if (result.success) {
        console.log(`Sync completed: ${result.processed} items processed`)
      } else {
        console.error('Sync failed:', result.errors)
      }
      
      await updateStatus()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncInProgress(false)
    }
  }

  const handleClearCompleted = async () => {
    try {
      await offlineQueue.clearCompleted()
      await updateStatus()
    } catch (error) {
      console.error('Failed to clear completed items:', error)
    }
  }

  const handleClearFailed = async () => {
    try {
      await offlineQueue.clearFailed()
      await updateStatus()
    } catch (error) {
      console.error('Failed to clear failed items:', error)
    }
  }

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return '대기 중'
      case 'processing': return '처리 중'
      case 'completed': return '완료'
      case 'failed': return '실패'
      default: return '알 수 없음'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">
          📱 오프라인 큐 관리
        </h1>

        {/* 네트워크 상태 */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">네트워크 상태</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  {isOnline ? '온라인' : '오프라인'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">마지막 동기화</p>
              <p className="text-sm font-medium">
                {lastSync ? lastSync.toLocaleTimeString('ko-KR') : '없음'}
              </p>
            </div>
          </div>
        </Card>

        {/* 큐 상태 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{queueStatus.total}</div>
            <div className="text-sm text-gray-600">전체</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{queueStatus.pending}</div>
            <div className="text-sm text-gray-600">대기 중</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{queueStatus.processing}</div>
            <div className="text-sm text-gray-600">처리 중</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{queueStatus.completed}</div>
            <div className="text-sm text-gray-600">완료</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{queueStatus.failed}</div>
            <div className="text-sm text-gray-600">실패</div>
          </Card>
        </div>

        {/* 동기화 컨트롤 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">동기화 제어</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleSync}
              disabled={!isOnline || syncInProgress}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncInProgress ? '동기화 중...' : '수동 동기화'}
            </Button>
            <Button
              onClick={handleClearCompleted}
              disabled={queueStatus.completed === 0}
              variant="outline"
            >
              완료된 항목 삭제
            </Button>
            <Button
              onClick={handleClearFailed}
              disabled={queueStatus.failed === 0}
              variant="outline"
            >
              실패한 항목 삭제
            </Button>
          </div>
        </Card>

        {/* 큐 아이템 목록 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">큐 아이템 목록</h2>
          
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              큐에 저장된 항목이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {item.type === 'audio' && '🎤 음성 신고'}
                        {item.type === 'text' && '📝 텍스트 신고'}
                        {item.type === 'image' && '📷 이미지 신고'}
                        {item.type === 'video' && '🎥 영상 신고'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  
                  {item.transcript && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>전사:</strong> {item.transcript}
                    </p>
                  )}
                  
                  {item.lat && item.lng && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>위치:</strong> {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                    </p>
                  )}
                  
                  {item.files.length > 0 && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>파일:</strong> {item.files.length}개
                    </p>
                  )}
                  
                  {item.retryCount > 0 && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>재시도:</strong> {item.retryCount}/{item.maxRetries}
                    </p>
                  )}
                  
                  {item.errorMessage && (
                    <p className="text-sm text-red-600">
                      <strong>오류:</strong> {item.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 접근성 정보 */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">접근성 정보</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• 오프라인 상태에서도 신고를 제출할 수 있습니다.</p>
            <p>• 네트워크가 복구되면 자동으로 동기화됩니다.</p>
            <p>• 실패한 항목은 최대 3회까지 자동 재시도됩니다.</p>
            <p>• 개인정보는 로컬에서 암호화되어 저장됩니다.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
