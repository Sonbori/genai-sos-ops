'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

// 목업 데이터
const mockReports = [
  {
    id: 1,
    type: '화재',
    severity: 'high',
    location: '서울시 강남구 테헤란로 123',
    timestamp: new Date().toISOString(),
    status: 'active',
    description: '건물 3층에서 연기가 보입니다.'
  },
  {
    id: 2,
    type: '교통사고',
    severity: 'medium',
    location: '서울시 서초구 서초대로 456',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'processing',
    description: '2차선에서 차량 충돌 사고 발생'
  },
  {
    id: 3,
    type: '응급의료',
    severity: 'high',
    location: '서울시 마포구 홍대입구역',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: 'resolved',
    description: '지하철역에서 의식 잃은 환자 발견'
  }
]

export default function DashboardPage() {
  const [reports, setReports] = useState(mockReports)
  const [filter, setFilter] = useState('all')

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    return report.status === filter
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">📊 상황실 대시보드</h1>
          <p className="text-gray-600">실시간 신고 현황 및 AI 분석 결과</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {reports.filter(r => r.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">진행 중</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-600">처리 중</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">해결됨</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {reports.length}
            </div>
            <div className="text-sm text-gray-600">전체</div>
          </Card>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button 
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
            >
              전체
            </Button>
            <Button 
              onClick={() => setFilter('active')}
              variant={filter === 'active' ? 'default' : 'outline'}
            >
              진행 중
            </Button>
            <Button 
              onClick={() => setFilter('processing')}
              variant={filter === 'processing' ? 'default' : 'outline'}
            >
              처리 중
            </Button>
            <Button 
              onClick={() => setFilter('resolved')}
              variant={filter === 'resolved' ? 'default' : 'outline'}
            >
              해결됨
            </Button>
          </div>
        </div>

        {/* 신고 목록 */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{report.type}</h3>
                  <p className="text-gray-600">{report.location}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(report.severity)}`}>
                    {report.severity === 'high' ? '높음' : 
                     report.severity === 'medium' ? '보통' : '낮음'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status === 'active' ? '진행 중' :
                     report.status === 'processing' ? '처리 중' : '해결됨'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{report.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>신고 시간: {new Date(report.timestamp).toLocaleString('ko-KR')}</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">상세보기</Button>
                  <Button size="sm" variant="outline">위치보기</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 지도 영역 (목업) */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📍 신고 위치 지도</h2>
          <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
            <p className="text-gray-500">지도 컴포넌트 (Leaflet/Mapbox 연동 예정)</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
