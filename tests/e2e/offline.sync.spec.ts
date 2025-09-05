import { test, expect } from '@playwright/test'

test.describe('오프라인 큐 동기화', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/offline')
  })

  test('오프라인 상태에서 신고 제출 후 온라인 전환 시 자동 동기화', async ({ page }) => {
    // 1. 네트워크 차단 (오프라인 모드)
    await page.route('**/*', route => route.abort())
    
    // 2. 오프라인 큐 페이지에서 상태 확인
    await expect(page.locator('text=오프라인')).toBeVisible()
    
    // 3. 신고 접수 페이지로 이동
    await page.goto('/intake')
    
    // 4. 텍스트 신고 입력
    await page.fill('textarea', '오프라인 테스트 신고입니다')
    
    // 5. 신고 제출 (오프라인 상태)
    await page.click('button:has-text("긴급 신고 제출")')
    
    // 6. 오프라인 큐 페이지로 이동하여 확인
    await page.goto('/offline')
    
    // 7. 큐에 항목이 추가되었는지 확인
    await expect(page.locator('text=대기 중')).toBeVisible()
    await expect(page.locator('text=오프라인 테스트 신고입니다')).toBeVisible()
    
    // 8. 네트워크 복구 (온라인 모드)
    await page.unroute('**/*')
    
    // 9. 온라인 상태 확인
    await expect(page.locator('text=온라인')).toBeVisible()
    
    // 10. 자동 동기화 대기 (최대 30초)
    await page.waitForSelector('text=완료', { timeout: 30000 })
    
    // 11. 동기화 완료 확인
    await expect(page.locator('text=완료')).toBeVisible()
  })

  test('수동 동기화 버튼 작동', async ({ page }) => {
    // 1. 오프라인 상태에서 신고 추가
    await page.route('**/*', route => route.abort())
    
    await page.goto('/intake')
    await page.fill('textarea', '수동 동기화 테스트')
    await page.click('button:has-text("긴급 신고 제출")')
    
    await page.goto('/offline')
    await expect(page.locator('text=대기 중')).toBeVisible()
    
    // 2. 온라인 상태로 복구
    await page.unroute('**/*')
    
    // 3. 수동 동기화 버튼 클릭
    await page.click('button:has-text("수동 동기화")')
    
    // 4. 동기화 진행 상태 확인
    await expect(page.locator('text=동기화 중...')).toBeVisible()
    
    // 5. 동기화 완료 대기
    await page.waitForSelector('text=완료', { timeout: 10000 })
    
    // 6. 완료 상태 확인
    await expect(page.locator('text=완료')).toBeVisible()
  })

  test('재시도 로직 테스트', async ({ page }) => {
    // 1. 서버 오류 시뮬레이션
    await page.route('/api/reports', route => 
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )
    
    // 2. 신고 제출
    await page.goto('/intake')
    await page.fill('textarea', '재시도 테스트 신고')
    await page.click('button:has-text("긴급 신고 제출")')
    
    // 3. 오프라인 큐에서 실패 상태 확인
    await page.goto('/offline')
    await expect(page.locator('text=실패')).toBeVisible()
    
    // 4. 재시도 횟수 확인
    await expect(page.locator('text=재시도: 1/3')).toBeVisible()
    
    // 5. 서버 정상화
    await page.unroute('/api/reports')
    await page.route('/api/reports', route => 
      route.fulfill({ status: 200, body: 'OK' })
    )
    
    // 6. 수동 동기화로 재시도
    await page.click('button:has-text("수동 동기화")')
    
    // 7. 성공 확인
    await page.waitForSelector('text=완료', { timeout: 10000 })
    await expect(page.locator('text=완료')).toBeVisible()
  })

  test('큐 상태 통계 정확성', async ({ page }) => {
    // 1. 여러 신고 추가
    await page.route('**/*', route => route.abort())
    
    for (let i = 1; i <= 3; i++) {
      await page.goto('/intake')
      await page.fill('textarea', `테스트 신고 ${i}`)
      await page.click('button:has-text("긴급 신고 제출")')
    }
    
    // 2. 오프라인 큐에서 통계 확인
    await page.goto('/offline')
    
    // 3. 전체 3개, 대기 중 3개 확인
    await expect(page.locator('text=3').first()).toBeVisible() // 전체
    await expect(page.locator('text=3').nth(1)).toBeVisible() // 대기 중
    
    // 4. 온라인 복구 후 동기화
    await page.unroute('**/*')
    await page.click('button:has-text("수동 동기화")')
    
    // 5. 완료 후 통계 확인
    await page.waitForSelector('text=완료', { timeout: 10000 })
    
    // 6. 완료된 항목 삭제
    await page.click('button:has-text("완료된 항목 삭제")')
    
    // 7. 큐가 비어있는지 확인
    await expect(page.locator('text=큐에 저장된 항목이 없습니다')).toBeVisible()
  })

  test('접근성 테스트', async ({ page }) => {
    // 1. 키보드 네비게이션 테스트
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // 2. 포커스 상태 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBe('BUTTON')
    
    // 3. 스크린 리더 지원 확인
    const button = page.locator('button:has-text("수동 동기화")')
    const ariaLabel = await button.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    
    // 4. 색상 대비 확인 (시각적)
    const statusIndicator = page.locator('.w-3.h-3.rounded-full')
    const backgroundColor = await statusIndicator.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    )
    expect(backgroundColor).toBeTruthy()
  })

  test('모바일 반응형 테스트', async ({ page }) => {
    // 1. 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 2. 레이아웃 확인
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=네트워크 상태')).toBeVisible()
    
    // 3. 버튼들이 터치하기 쉬운 크기인지 확인
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44) // 최소 터치 타겟 크기
    }
    
    // 4. 스크롤 가능한지 확인
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('text=접근성 정보')).toBeVisible()
  })

  test('오프라인 페이지 캐싱', async ({ page }) => {
    // 1. 첫 방문
    await page.goto('/offline')
    await expect(page.locator('h1')).toBeVisible()
    
    // 2. 네트워크 차단
    await page.route('**/*', route => route.abort())
    
    // 3. 페이지 새로고침
    await page.reload()
    
    // 4. 오프라인 상태에서도 페이지가 로드되는지 확인
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=오프라인')).toBeVisible()
  })
})
