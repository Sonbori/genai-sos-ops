-- GenAI SOS Ops 데이터베이스 스키마
-- PostgreSQL + Supabase

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 조직 테이블
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('government', 'private', 'ngo', 'campus', 'event')),
    region VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 테이블 (Supabase Auth 확장)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'operator', 'user')),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    emergency_contact VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사건/사고 테이블
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    category VARCHAR(100) NOT NULL, -- 화재, 교통사고, 응급의료, 자연재해 등
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'resolved', 'closed')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255),
    location_coordinates POINT, -- PostGIS POINT 타입
    location_accuracy FLOAT,
    ai_analysis JSONB, -- AI 분석 결과
    assigned_to UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 신고 테이블
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id),
    organization_id UUID REFERENCES organizations(id),
    reporter_id UUID REFERENCES profiles(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('voice', 'text', 'image', 'video', 'multimodal')),
    content TEXT, -- 텍스트 내용 또는 STT 결과
    media_urls TEXT[], -- 업로드된 미디어 파일 URL 배열
    location_coordinates POINT,
    location_accuracy FLOAT,
    confidence_score FLOAT, -- AI 신뢰도 점수
    ai_summary TEXT, -- AI 요약
    ai_classification JSONB, -- AI 분류 결과
    is_offline BOOLEAN DEFAULT FALSE, -- 오프라인에서 제출된 신고
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 오프라인 큐 테이블
CREATE TABLE offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    report_data JSONB NOT NULL, -- 신고 데이터
    media_files JSONB, -- 미디어 파일 메타데이터
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 분석 로그 테이블
CREATE TABLE ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id),
    model_name VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location_coordinates);

CREATE INDEX idx_reports_incident_id ON reports(incident_id);
CREATE INDEX idx_reports_organization_id ON reports(organization_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_sync_status ON reports(sync_status);
CREATE INDEX idx_reports_location ON reports USING GIST(location_coordinates);

CREATE INDEX idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX idx_offline_queue_status ON offline_queue(status);
CREATE INDEX idx_offline_queue_created_at ON offline_queue(created_at);

CREATE INDEX idx_ai_analysis_logs_report_id ON ai_analysis_logs(report_id);
CREATE INDEX idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at);

-- Row Level Security (RLS) 정책
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- 조직 정책
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 프로필 정책
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- 사건 정책
CREATE POLICY "Users can view incidents in their organization" ON incidents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Operators can create incidents" ON incidents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
            AND organization_id = incidents.organization_id
        )
    );

-- 신고 정책
CREATE POLICY "Users can view reports in their organization" ON reports
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 오프라인 큐 정책
CREATE POLICY "Users can manage their own offline queue" ON offline_queue
    FOR ALL USING (user_id = auth.uid());

-- AI 분석 로그 정책
CREATE POLICY "Users can view AI logs for their organization" ON ai_analysis_logs
    FOR SELECT USING (
        report_id IN (
            SELECT r.id FROM reports r
            JOIN profiles p ON r.organization_id = p.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_queue_updated_at BEFORE UPDATE ON offline_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 데이터 삽입
INSERT INTO organizations (name, type, region, contact_email) VALUES
('서울시 긴급상황관리센터', 'government', '서울특별시', 'emergency@seoul.go.kr'),
('테스트 조직', 'private', '서울특별시', 'test@example.com');

-- 뷰 생성 (통계용)
CREATE VIEW incident_stats AS
SELECT 
    o.name as organization_name,
    i.category,
    i.severity,
    i.status,
    COUNT(*) as count,
    DATE_TRUNC('day', i.created_at) as date
FROM incidents i
JOIN organizations o ON i.organization_id = o.id
GROUP BY o.name, i.category, i.severity, i.status, DATE_TRUNC('day', i.created_at);

CREATE VIEW report_stats AS
SELECT 
    o.name as organization_name,
    r.type,
    COUNT(*) as count,
    AVG(r.confidence_score) as avg_confidence,
    DATE_TRUNC('hour', r.created_at) as hour
FROM reports r
JOIN organizations o ON r.organization_id = o.id
GROUP BY o.name, r.type, DATE_TRUNC('hour', r.created_at);
