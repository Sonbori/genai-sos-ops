import { test, expect } from '@playwright/test'

test.describe('신고 접수 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/intake')
  })

  test('페이지가 올바르게 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveTitle(/GenAI SOS Ops/)
    await expect(page.locator('h1')).toContainText('긴급 신고 접수')
  })

  test('음성 녹음 버튼이 작동해야 함', async ({ page }) => {
    const recordButton = page.locator('button:has-text("음성 녹음 시작")')
    await expect(recordButton).toBeVisible()
    
    await recordButton.click()
    await expect(page.locator('button:has-text("녹음 중지")')).toBeVisible()
    await expect(page.locator('text=녹음 중...')).toBeVisible()
  })

  test('파일 업로드가 작동해야 함', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeVisible()
    
    // 테스트용 이미지 파일 생성
    const testFile = Buffer.from('fake image content')
    
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: testFile
    })
    
    await expect(page.locator('text=업로드된 파일:')).toBeVisible()
    await expect(page.locator('text=test-image.jpg')).toBeVisible()
  })

  test('텍스트 신고 입력이 작동해야 함', async ({ page }) => {
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    
    await textarea.fill('테스트 긴급 신고입니다.')
    await expect(textarea).toHaveValue('테스트 긴급 신고입니다.')
  })

  test('신고 제출 버튼이 작동해야 함', async ({ page }) => {
    const submitButton = page.locator('button:has-text("긴급 신고 제출")')
    await expect(submitButton).toBeVisible()
    
    // 텍스트 입력
    await page.locator('textarea').fill('테스트 신고')
    
    // 제출 버튼 클릭
    await submitButton.click()
    
    // 성공 메시지 확인 (실제 구현에 따라 조정)
    await expect(page.locator('text=제출된 신고는 AI가 자동으로 분석하여')).toBeVisible()
  })

  test('모바일에서 접근성이 좋아야 함', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const recordButton = page.locator('button:has-text("음성 녹음 시작")')
    await expect(recordButton).toBeVisible()
    
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeVisible()
    
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
  })
})
