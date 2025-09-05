import { openDB, DBSchema, IDBPDatabase } from 'idb'

// 타입 정의
export interface QueueItem {
  id: string
  type: 'audio' | 'text' | 'image' | 'video'
  files: File[]
  transcript?: string
  lang?: string
  lat?: number
  lng?: number
  createdAt: string
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
}

export interface QueueStatus {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}

export interface SyncResult {
  success: boolean
  processed: number
  failed: number
  errors: string[]
}

// IndexedDB 스키마
interface SOSDB extends DBSchema {
  queue: {
    key: string
    value: QueueItem
    indexes: { 'by-status': string; 'by-created': string }
  }
}

class OfflineQueue {
  private db: IDBPDatabase<SOSDB> | null = null
  private syncInProgress = false
  private abortController: AbortController | null = null
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<SOSDB>('sos-offline-queue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('queue', { keyPath: 'id' })
        store.createIndex('by-status', 'status')
        store.createIndex('by-created', 'createdAt')
      },
    })

    // 네트워크 상태 감지
    this.setupNetworkListeners()
    
    // 자동 동기화 시작
    this.startAutoSync()
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      console.log('Network online - starting sync')
      this.sync()
    })

    window.addEventListener('offline', () => {
      console.log('Network offline - stopping sync')
      this.stopSync()
    })
  }

  private startAutoSync(): void {
    if (typeof window === 'undefined') return

    // 30초마다 동기화 시도
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.sync()
      }
    }, 30000)
  }

  async enqueue(item: Omit<QueueItem, 'id' | 'retryCount' | 'maxRetries' | 'status'>): Promise<string> {
    await this.init()

    const queueItem: QueueItem = {
      ...item,
      id: crypto.randomUUID(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    }

    await this.db!.add('queue', queueItem)
    
    // 네트워크가 온라인이면 즉시 동기화 시도
    if (navigator.onLine) {
      this.sync()
    }

    return queueItem.id
  }

  async getStatus(): Promise<QueueStatus> {
    await this.init()

    const all = await this.db!.getAll('queue')
    
    return {
      total: all.length,
      pending: all.filter(item => item.status === 'pending').length,
      processing: all.filter(item => item.status === 'processing').length,
      completed: all.filter(item => item.status === 'completed').length,
      failed: all.filter(item => item.status === 'failed').length,
    }
  }

  async getAllItems(): Promise<QueueItem[]> {
    await this.init()
    return await this.db!.getAll('queue')
  }

  async sync(): Promise<SyncResult> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: false, processed: 0, failed: 0, errors: ['Sync already in progress or offline'] }
    }

    this.syncInProgress = true
    this.abortController = new AbortController()

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    }

    try {
      const pendingItems = await this.getPendingItems()
      
      for (const item of pendingItems) {
        if (this.abortController.signal.aborted) break

        try {
          await this.updateItemStatus(item.id, 'processing')
          
          const success = await this.uploadItem(item)
          
          if (success) {
            await this.updateItemStatus(item.id, 'completed')
            await this.removeItem(item.id)
            result.processed++
          } else {
            await this.handleRetry(item)
            result.failed++
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          await this.handleRetry(item)
          result.failed++
          result.errors.push(`Item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      result.success = result.failed === 0
    } catch (error) {
      console.error('Sync failed:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      this.syncInProgress = false
      this.abortController = null
    }

    return result
  }

  private async getPendingItems(): Promise<QueueItem[]> {
    await this.init()
    return await this.db!.getAllFromIndex('queue', 'by-status', 'pending')
  }

  private async updateItemStatus(id: string, status: QueueItem['status'], errorMessage?: string): Promise<void> {
    await this.init()
    
    const item = await this.db!.get('queue', id)
    if (item) {
      item.status = status
      if (errorMessage) {
        item.errorMessage = errorMessage
      }
      await this.db!.put('queue', item)
    }
  }

  private async removeItem(id: string): Promise<void> {
    await this.init()
    await this.db!.delete('queue', id)
  }

  private async uploadItem(item: QueueItem): Promise<boolean> {
    try {
      const formData = new FormData()
      
      // 기본 데이터
      formData.append('type', item.type)
      formData.append('transcript', item.transcript || '')
      formData.append('lang', item.lang || 'ko')
      formData.append('lat', item.lat?.toString() || '')
      formData.append('lng', item.lng?.toString() || '')
      formData.append('createdAt', item.createdAt)

      // 파일들
      for (const file of item.files) {
        formData.append('files', file)
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
        signal: this.abortController?.signal,
      })

      return response.ok
    } catch (error) {
      console.error('Upload failed:', error)
      return false
    }
  }

  private async handleRetry(item: QueueItem): Promise<void> {
    const newRetryCount = item.retryCount + 1

    if (newRetryCount >= item.maxRetries) {
      await this.updateItemStatus(item.id, 'failed', 'Max retries exceeded')
    } else {
      // 지수 백오프: 2^retryCount * 1000ms
      const delay = Math.pow(2, newRetryCount) * 1000
      
      const timeout = setTimeout(async () => {
        await this.updateItemStatus(item.id, 'pending')
        this.retryTimeouts.delete(item.id)
      }, delay)

      this.retryTimeouts.set(item.id, timeout)
      
      await this.updateItemStatus(item.id, 'pending', `Retry ${newRetryCount}/${item.maxRetries} in ${delay}ms`)
    }
  }

  stopSync(): void {
    if (this.abortController) {
      this.abortController.abort()
    }

    // 모든 재시도 타이머 정리
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }

  async clearCompleted(): Promise<void> {
    await this.init()
    
    const completedItems = await this.db!.getAllFromIndex('queue', 'by-status', 'completed')
    for (const item of completedItems) {
      await this.removeItem(item.id)
    }
  }

  async clearFailed(): Promise<void> {
    await this.init()
    
    const failedItems = await this.db!.getAllFromIndex('queue', 'by-status', 'failed')
    for (const item of failedItems) {
      await this.removeItem(item.id)
    }
  }
}

// 싱글톤 인스턴스
export const offlineQueue = new OfflineQueue()

// PWA 관련 유틸리티
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export const getNetworkStatus = (): 'online' | 'offline' => {
  return isOnline() ? 'online' : 'offline'
}
