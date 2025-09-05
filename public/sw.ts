// Service Worker for GenAI SOS Ops
// 오프라인 지원 및 캐싱 전략

const CACHE_NAME = 'sos-ops-v1'
const STATIC_CACHE = 'sos-ops-static-v1'
const DYNAMIC_CACHE = 'sos-ops-dynamic-v1'

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/intake',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// 캐시할 API 엔드포인트
const API_CACHE_PATTERNS = [
  /^\/api\/reports/,
  /^\/api\/stt/,
  /^\/api\/summary/,
]

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 네트워크 우선 전략 (API 요청)
  if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request))
    return
  }

  // 캐시 우선 전략 (정적 리소스)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // 네트워크 우선 전략 (일반 페이지)
  event.respondWith(networkFirst(request))
})

// API 요청인지 확인
function isAPIRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/')
}

// 정적 리소스인지 확인
function isStaticAsset(url: URL): boolean {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

// 네트워크 우선 전략
async function networkFirst(request: Request): Promise<Response> {
  try {
    // 네트워크 요청 시도
    const networkResponse = await fetch(request)
    
    // 성공 시 캐시에 저장
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network request failed, trying cache:', error)
    
    // 네트워크 실패 시 캐시에서 찾기
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 캐시에도 없으면 오프라인 페이지 반환
    if (request.destination === 'document') {
      return caches.match('/offline')
    }
    
    throw error
  }
}

// 캐시 우선 전략
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch resource:', error)
    throw error
  }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(syncOfflineQueue())
  }
})

// 오프라인 큐 동기화
async function syncOfflineQueue(): Promise<void> {
  try {
    console.log('Syncing offline queue...')
    
    // 클라이언트에게 동기화 요청
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_OFFLINE_QUEUE',
        timestamp: Date.now()
      })
    })
    
    console.log('Offline queue sync completed')
  } catch (error) {
    console.error('Failed to sync offline queue:', error)
  }
}

// 푸시 알림
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  if (event.data) {
    const data = event.data.json()
    
    const options: NotificationOptions = {
      body: data.body || '새로운 긴급 신고가 접수되었습니다.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'emergency-report',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: '확인',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: '닫기',
          icon: '/icons/action-dismiss.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || '긴급 신고', options)
    )
  }
})

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// 메시지 처리
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls)
        })
    )
  }
})

// 오류 처리
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event)
})

// 주기적 백그라운드 동기화
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag)
  
  if (event.tag === 'offline-queue-cleanup') {
    event.waitUntil(cleanupOfflineQueue())
  }
})

// 오프라인 큐 정리
async function cleanupOfflineQueue(): Promise<void> {
  try {
    console.log('Cleaning up offline queue...')
    
    // 7일 이상 된 완료된 항목 정리
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: 'CLEANUP_OFFLINE_QUEUE',
        timestamp: Date.now()
      })
    })
    
    console.log('Offline queue cleanup completed')
  } catch (error) {
    console.error('Failed to cleanup offline queue:', error)
  }
}

export {}
