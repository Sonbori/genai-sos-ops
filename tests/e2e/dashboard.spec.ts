import { test, expect } from '@playwright/test'

test.describe('대시보드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('페이지가 올바르게 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveTitle(/GenAI SOS Ops/)
    await expect(page.locator('h1')).toContainText('상황실 대시보드')
  })

  test('통계 카드가 표시되어야 함', async ({ page }) => {
    await expect(page.locator('text=진행 중')).toBeVisible()
    await expect(page.locator('text=처리 중')).toBeVisible()
    await expect(page.locator('text=해결됨')).toBeVisible()
    await expect(page.locator('text=전체')).toBeVisible()
  })

  test('필터 버튼이 작동해야 함', async ({ page }) => {
    const allButton = page.locator('button:has-text("전체")')
    const activeButton = page.locator('button:has-text("진행 중")')
    const processingButton = page.locator('button:has-text("처리 중")')
    const resolvedButton = page.locator('button:has-text("해결됨")')
    
    await expect(allButton).toBeVisible()
    await expect(activeButton).toBeVisible()
    await expect(processingButton).toBeVisible()
    await expect(resolvedButton).toBeVisible()
    
    // 필터 클릭 테스트
    await activeButton.click()
    await expect(activeButton).toHaveClass(/bg-primary/)
    
    await processingButton.click()
    await expect(processingButton).toHaveClass(/bg-primary/)
  })

  test('신고 목록이 표시되어야 함', async ({ page }) => {
    // 목업 데이터 확인
    await expect(page.locator('text=화재')).toBeVisible()
    await expect(page.locator('text=교통사고')).toBeVisible()
    await expect(page.locator('text=응급의료')).toBeVisible()
  })

  test('신고 카드의 상세 정보가 표시되어야 함', async ({ page }) => {
    const firstReport = page.locator('[data-testid="report-card"]').first()
    
    await expect(firstReport.locator('text=높음')).toBeVisible()
    await expect(firstReport.locator('text=진행 중')).toBeVisible()
    await expect(firstReport.locator('button:has-text("상세보기")')).toBeVisible()
    await expect(firstReport.locator('button:has-text("위치보기")')).toBeVisible()
  })

  test('지도 영역이 표시되어야 함', async ({ page }) => {
    await expect(page.locator('text=신고 위치 지도')).toBeVisible()
    await expect(page.locator('text=지도 컴포넌트')).toBeVisible()
  })

  test('반응형 디자인이 작동해야 함', async ({ page }) => {
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('h1')).toBeVisible()
    
    // 태블릿 뷰
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1')).toBeVisible()
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('실시간 업데이트 시뮬레이션', async ({ page }) => {
    // 초기 신고 수 확인
    const initialCount = await page.locator('text=진행 중').locator('..').locator('div').first().textContent()
    
    // 새 신고 추가 시뮬레이션 (실제로는 WebSocket 또는 폴링으로 구현)
    await page.evaluate(() => {
      // 목업 데이터에 새 신고 추가
      window.dispatchEvent(new CustomEvent('new-report', {
        detail: {
          id: 4,
          type: '범죄',
          severity: 'medium',
          location: '서울시 마포구 홍대입구역',
          timestamp: new Date().toISOString(),
          status: 'active',
          description: '새로운 신고가 접수되었습니다.'
        }
      }))
    })
    
    // 페이지 새로고침으로 변경사항 확인
    await page.reload()
    await expect(page.locator('text=범죄')).toBeVisible()
  })
})
