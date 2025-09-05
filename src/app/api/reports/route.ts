import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/shared/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // 폼 데이터 추출
    const type = formData.get('type') as string
    const transcript = formData.get('transcript') as string
    const lang = formData.get('lang') as string || 'ko'
    const lat = formData.get('lat') as string
    const lng = formData.get('lng') as string
    const createdAt = formData.get('createdAt') as string
    const files = formData.getAll('files') as File[]

    // 위치 정보 파싱
    const location_coordinates = lat && lng ? 
      `POINT(${lng} ${lat})` : null

    // 미디어 파일 업로드
    const media_urls: string[] = []
    
    for (const file of files) {
      if (file.size > 0) {
        const fileName = `${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage
          .from('reports')
          .upload(fileName, file)

        if (error) {
          console.error('File upload error:', error)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('reports')
          .getPublicUrl(fileName)

        media_urls.push(publicUrl)
      }
    }

    // 신고 데이터 저장
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        type: type as 'voice' | 'text' | 'image' | 'video' | 'multimodal',
        content: transcript,
        media_urls: media_urls.length > 0 ? media_urls : null,
        location_coordinates: location_coordinates,
        location_accuracy: lat && lng ? 10 : null, // 기본 정확도 10m
        confidence_score: 0.8, // 기본 신뢰도
        is_offline: false,
        sync_status: 'synced',
        created_at: createdAt || new Date().toISOString(),
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report insert error:', reportError)
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      )
    }

    // AI 분석 (비동기)
    if (transcript) {
      analyzeReportAsync(report.id, transcript, type)
    }

    return NextResponse.json(
      { 
        success: true, 
        reportId: report.id,
        message: 'Report saved successfully' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 비동기 AI 분석 함수
async function analyzeReportAsync(reportId: string, transcript: string, type: string) {
  try {
    // AI 분석 로직 (나중에 구현)
    const analysis = {
      category: '기타',
      severity: 'medium',
      summary: transcript.substring(0, 100) + '...',
      confidence: 0.8,
      location_hints: [],
      keywords: [],
      urgency_score: 50,
    }

    // 분석 결과 저장
    await supabase
      .from('reports')
      .update({
        ai_summary: analysis.summary,
        ai_classification: analysis,
        confidence_score: analysis.confidence,
      })
      .eq('id', reportId)

    console.log('AI analysis completed for report:', reportId)
  } catch (error) {
    console.error('AI analysis error:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        incidents (
          id,
          category,
          severity,
          status,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Reports fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports }, { status: 200 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
