import { openDB, DBSchema, IDBPDatabase } from 'idb'

// IndexedDB 래퍼 클래스
export class IDBWrapper<T extends DBSchema> {
  private db: IDBPDatabase<T> | null = null
  private dbName: string
  private version: number
  private upgradeCallback?: (db: IDBPDatabase<T>) => void

  constructor(
    dbName: string,
    version: number = 1,
    upgradeCallback?: (db: IDBPDatabase<T>) => void
  ) {
    this.dbName = dbName
    this.version = version
    this.upgradeCallback = upgradeCallback
  }

  async init(): Promise<IDBPDatabase<T>> {
    if (this.db) return this.db

    this.db = await openDB<T>(this.dbName, this.version, {
      upgrade: this.upgradeCallback,
    })

    return this.db
  }

  async get<K extends keyof T['stores']>(
    storeName: K,
    key: IDBValidKey
  ): Promise<T['stores'][K]['value'] | undefined> {
    const db = await this.init()
    return await db.get(storeName, key)
  }

  async getAll<K extends keyof T['stores']>(
    storeName: K
  ): Promise<T['stores'][K]['value'][]> {
    const db = await this.init()
    return await db.getAll(storeName)
  }

  async put<K extends keyof T['stores']>(
    storeName: K,
    value: T['stores'][K]['value'],
    key?: IDBValidKey
  ): Promise<IDBValidKey> {
    const db = await this.init()
    return await db.put(storeName, value, key)
  }

  async add<K extends keyof T['stores']>(
    storeName: K,
    value: T['stores'][K]['value'],
    key?: IDBValidKey
  ): Promise<IDBValidKey> {
    const db = await this.init()
    return await db.add(storeName, value, key)
  }

  async delete<K extends keyof T['stores']>(
    storeName: K,
    key: IDBValidKey
  ): Promise<void> {
    const db = await this.init()
    return await db.delete(storeName, key)
  }

  async clear<K extends keyof T['stores']>(storeName: K): Promise<void> {
    const db = await this.init()
    return await db.clear(storeName)
  }

  async count<K extends keyof T['stores']>(storeName: K): Promise<number> {
    const db = await this.init()
    return await db.count(storeName)
  }

  async getAllFromIndex<K extends keyof T['stores'], I extends keyof T['stores'][K]['indexes']>(
    storeName: K,
    indexName: I,
    query?: IDBValidKey | IDBKeyRange
  ): Promise<T['stores'][K]['value'][]> {
    const db = await this.init()
    return await db.getAllFromIndex(storeName, indexName, query)
  }

  async getFromIndex<K extends keyof T['stores'], I extends keyof T['stores'][K]['indexes']>(
    storeName: K,
    indexName: I,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T['stores'][K]['value'] | undefined> {
    const db = await this.init()
    return await db.getFromIndex(storeName, indexName, query)
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 암호화 유틸리티
export class CryptoUtils {
  private static key: CryptoKey | null = null

  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async getOrCreateKey(): Promise<CryptoKey> {
    if (this.key) return this.key

    // 로컬 스토리지에서 키 복원 시도
    const storedKey = localStorage.getItem('sos-crypto-key')
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey)
        this.key = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(keyData),
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        )
        return this.key
      } catch (error) {
        console.warn('Failed to restore crypto key:', error)
      }
    }

    // 새 키 생성
    this.key = await this.generateKey()
    
    // 키 저장
    const keyData = await crypto.subtle.exportKey('raw', this.key)
    localStorage.setItem('sos-crypto-key', JSON.stringify(Array.from(new Uint8Array(keyData))))
    
    return this.key
  }

  static async encrypt(data: string): Promise<string> {
    const key = await this.getOrCreateKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(data)
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoded
    )

    // IV + 암호화된 데이터를 결합
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  static async decrypt(encryptedData: string): Promise<string> {
    const key = await this.getOrCreateKey()
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )

    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    )

    return new TextDecoder().decode(decrypted)
  }
}

// 로컬 스토리지 유틸리티
export class LocalStorageUtils {
  static setItem(key: string, value: any): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set localStorage item:', error)
    }
  }

  static getItem<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error('Failed to get localStorage item:', error)
      return defaultValue || null
    }
  }

  static removeItem(key: string): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove localStorage item:', error)
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// 네트워크 상태 유틸리티
export class NetworkUtils {
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  static getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown'
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    return connection ? connection.effectiveType || 'unknown' : 'unknown'
  }

  static getConnectionSpeed(): string {
    if (typeof navigator === 'undefined') return 'unknown'
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    return connection ? connection.effectiveType || 'unknown' : 'unknown'
  }

  static onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}
