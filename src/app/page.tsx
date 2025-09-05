import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GenAI SOS Ops
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            생성형 AI 기반 재난 대응 및 위급 상황 긴급 신고 분석 플랫폼
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link 
              href="/intake"
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-blue-600 mb-4">
                🚨 긴급 신고
              </h2>
              <p className="text-gray-600">
                음성, 텍스트, 이미지, 영상을 통한 다중 채널 신고 접수
              </p>
            </Link>
            
            <Link 
              href="/dashboard"
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-green-600 mb-4">
                📊 상황실 대시보드
              </h2>
              <p className="text-gray-600">
                실시간 신고 현황 및 AI 분석 결과 모니터링
              </p>
            </Link>

            <Link 
              href="/offline"
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-orange-600 mb-4">
                📱 오프라인 큐
              </h2>
              <p className="text-gray-600">
                네트워크 불안정 시에도 신고 접수 및 동기화 관리
              </p>
            </Link>
          </div>
          
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              주요 기능
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="bg-white p-4 rounded-lg">
                <strong>오프라인 우선</strong><br />
                네트워크 불안정 시 로컬 큐잉
              </div>
              <div className="bg-white p-4 rounded-lg">
                <strong>AI 자동 분류</strong><br />
                위험도 및 카테고리 자동 분석
              </div>
              <div className="bg-white p-4 rounded-lg">
                <strong>실시간 위치 추정</strong><br />
                GPS 및 멀티모달 위치 정보
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
