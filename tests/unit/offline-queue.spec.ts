import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { offlineQueue, QueueItem } from '@/features/offline-queue/lib/offlineQueue'

// IndexedDB 모킹
const mockDB = {
  add: vi.fn(),
  getAll: vi.fn(),
  getAllFromIndex: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
}

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}))

// 네트워크 상태 모킹
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

describe('OfflineQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDB.getAll.mockResolvedValue([])
    mockDB.getAllFromIndex.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('enqueue', () => {
    it('should add item to queue when offline', async () => {
      // 네트워크 오프라인으로 설정
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const testItem = {
        type: 'text' as const,
        files: [],
        transcript: '테스트 신고',
        lat: 37.5665,
        lng: 126.9780,
        createdAt: new Date().toISOString(),
      }

      mockDB.add.mockResolvedValue('test-id')

      const id = await offlineQueue.enqueue(testItem)

      expect(mockDB.add).toHaveBeenCalledWith('queue', expect.objectContaining({
        type: 'text',
        transcript: '테스트 신고',
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      }))
      expect(id).toBe('test-id')
    })

    it('should add item to queue when online', async () => {
      // 네트워크 온라인으로 설정
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const testItem = {
        type: 'audio' as const,
        files: [new File(['test'], 'test.wav', { type: 'audio/wav' })],
        transcript: '음성 신고',
        createdAt: new Date().toISOString(),
      }

      mockDB.add.mockResolvedValue('test-id')

      const id = await offlineQueue.enqueue(testItem)

      expect(mockDB.add).toHaveBeenCalledWith('queue', expect.objectContaining({
        type: 'audio',
        transcript: '음성 신고',
        status: 'pending',
      }))
      expect(id).toBe('test-id')
    })
  })

  describe('getStatus', () => {
    it('should return correct queue status', async () => {
      const mockItems: QueueItem[] = [
        {
          id: '1',
          type: 'text',
          files: [],
          createdAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        },
        {
          id: '2',
          type: 'audio',
          files: [],
          createdAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          status: 'processing',
        },
        {
          id: '3',
          type: 'image',
          files: [],
          createdAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          status: 'completed',
        },
        {
          id: '4',
          type: 'video',
          files: [],
          createdAt: new Date().toISOString(),
          retryCount: 3,
          maxRetries: 3,
          status: 'failed',
        },
      ]

      mockDB.getAll.mockResolvedValue(mockItems)

      const status = await offlineQueue.getStatus()

      expect(status).toEqual({
        total: 4,
        pending: 1,
        processing: 1,
        completed: 1,
        failed: 1,
      })
    })
  })

  describe('sync', () => {
    it('should sync pending items when online', async () => {
      // 네트워크 온라인으로 설정
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const mockPendingItems: QueueItem[] = [
        {
          id: '1',
          type: 'text',
          files: [],
          transcript: '테스트 신고',
          createdAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]

      mockDB.getAllFromIndex.mockResolvedValue(mockPendingItems)
      mockDB.get.mockResolvedValue(mockPendingItems[0])
      mockDB.put.mockResolvedValue(undefined)
      mockDB.delete.mockResolvedValue(undefined)

      // fetch 모킹
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })

      const result = await offlineQueue.sync()

      expect(result.success).toBe(true)
      expect(result.processed).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('should handle sync failure gracefully', async () => {
      // 네트워크 온라인으로 설정
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const mockPendingItems: QueueItem[] = [
        {
          id: '1',
          type: 'text',
          files: [],
          transcript: '테스트 신고',
          createdAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]

      mockDB.getAllFromIndex.mockResolvedValue(mockPendingItems)
      mockDB.get.mockResolvedValue(mockPendingItems[0])
      mockDB.put.mockResolvedValue(undefined)

      // fetch 실패 모킹
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      const result = await offlineQueue.sync()

      expect(result.success).toBe(false)
      expect(result.processed).toBe(0)
      expect(result.failed).toBe(1)
    })

    it('should not sync when offline', async () => {
      // 네트워크 오프라인으로 설정
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const result = await offlineQueue.sync()

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Sync already in progress or offline')
    })
  })

  describe('retry logic', () => {
    it('should retry failed items with exponential backoff', async () => {
      const mockItem: QueueItem = {
        id: '1',
        type: 'text',
        files: [],
        transcript: '테스트 신고',
        createdAt: new Date().toISOString(),
        retryCount: 1,
        maxRetries: 3,
        status: 'pending',
      }

      mockDB.get.mockResolvedValue(mockItem)
      mockDB.put.mockResolvedValue(undefined)

      // fetch 실패 모킹
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      // setTimeout 모킹
      vi.useFakeTimers()
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

      await offlineQueue.sync()

      // 재시도 타이머가 설정되었는지 확인
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000) // 2^1 * 1000ms

      vi.useRealTimers()
    })

    it('should mark item as failed after max retries', async () => {
      const mockItem: QueueItem = {
        id: '1',
        type: 'text',
        files: [],
        transcript: '테스트 신고',
        createdAt: new Date().toISOString(),
        retryCount: 2,
        maxRetries: 3,
        status: 'pending',
      }

      mockDB.get.mockResolvedValue(mockItem)
      mockDB.put.mockResolvedValue(undefined)

      // fetch 실패 모킹
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      await offlineQueue.sync()

      // 최대 재시도 횟수 초과 시 실패로 표시
      expect(mockDB.put).toHaveBeenCalledWith('queue', expect.objectContaining({
        status: 'failed',
        errorMessage: 'Max retries exceeded',
      }))
    })
  })

  describe('clear operations', () => {
    it('should clear completed items', async () => {
      const mockCompletedItems: QueueItem[] = [
        {
          id: '1',
          type: 'text',
          files: [],
          createdAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          status: 'completed',
        },
      ]

      mockDB.getAllFromIndex.mockResolvedValue(mockCompletedItems)
      mockDB.delete.mockResolvedValue(undefined)

      await offlineQueue.clearCompleted()

      expect(mockDB.getAllFromIndex).toHaveBeenCalledWith('queue', 'by-status', 'completed')
      expect(mockDB.delete).toHaveBeenCalledWith('queue', '1')
    })

    it('should clear failed items', async () => {
      const mockFailedItems: QueueItem[] = [
        {
          id: '1',
          type: 'text',
          files: [],
          createdAt: new Date().toISOString(),
          retryCount: 3,
          maxRetries: 3,
          status: 'failed',
        },
      ]

      mockDB.getAllFromIndex.mockResolvedValue(mockFailedItems)
      mockDB.delete.mockResolvedValue(undefined)

      await offlineQueue.clearFailed()

      expect(mockDB.getAllFromIndex).toHaveBeenCalledWith('queue', 'by-status', 'failed')
      expect(mockDB.delete).toHaveBeenCalledWith('queue', '1')
    })
  })
})
