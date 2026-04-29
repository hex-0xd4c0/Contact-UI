-- ============================================
-- EBike Cross-border Logistics Platform
-- Initial Database Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('admin', '系统管理员'),
    ('customer', '普通客户')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 3. Shipments Table
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., EB-2024-0001
    origin_city VARCHAR(100) NOT NULL,
    origin_country VARCHAR(100) NOT NULL,
    dest_city VARCHAR(100) NOT NULL,
    dest_country VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    transport_method VARCHAR(50) NOT NULL, -- sea, air, rail, truck
    carrier VARCHAR(100),
    weight_kg DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_transit, customs, delivered, delayed, exception
    current_location VARCHAR(255),
    eta TIMESTAMP,
    departure_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_id ON shipments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON shipments(created_by);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_eta ON shipments(eta);

-- ============================================
-- 4. Shipment Timeline Table
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_timeline (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    event_time TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_shipment_id ON shipment_timeline(shipment_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_time ON shipment_timeline(event_time);

-- ============================================
-- 5. Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL, -- invoice, packing_list, coo, bill_of_lading, certificate, other
    file_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded', -- uploaded, approved, rejected
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    expiry_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_shipment_id ON documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- ============================================
-- 6. Risk Alerts Table
-- ============================================
CREATE TABLE IF NOT EXISTS risk_alerts (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- delay, customs_issue, weather, document_missing, capacity, other
    severity VARCHAR(20) NOT NULL, -- critical, high, medium, low
    title VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, acknowledged, resolved
    user_id INTEGER REFERENCES users(id),
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_shipment_id ON risk_alerts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON risk_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON risk_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON risk_alerts(created_at DESC);

-- ============================================
-- 7. Shipping Rates Table (for cost calculator)
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_rates (
    id SERIAL PRIMARY KEY,
    transport_method VARCHAR(50) NOT NULL, -- sea, air, rail, truck
    origin_region VARCHAR(100) NOT NULL,
    dest_region VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL, -- base price per kg or per unit
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    min_weight_kg DECIMAL(10, 2) DEFAULT 0,
    max_weight_kg DECIMAL(10, 2),
    surcharge_rate DECIMAL(5, 2) DEFAULT 0, -- percentage surcharge
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rates_method_region ON shipping_rates(transport_method, origin_region, dest_region);
CREATE INDEX IF NOT EXISTS idx_rates_active ON shipping_rates(is_active);

-- ============================================
-- 8. Insert Sample Data
-- ============================================

-- Sample admin user (password: admin123)
INSERT INTO users (email, password_hash, company_name, contact_name, phone, role)
VALUES (
    'admin@ebike.com',
    '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmF0GqJ0KqKqKqKqKqK',
    '电摩跨境物流平台',
    '系统管理员',
    '13800138000',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Sample customer user (password: customer123)
INSERT INTO users (email, password_hash, company_name, contact_name, phone, role)
VALUES (
    'customer@ebike.com',
    '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmF0GqJ0KqKqKqKqKqK',
    '深圳电摩科技有限公司',
    '张三',
    '13900139000',
    'customer'
) ON CONFLICT (email) DO NOTHING;

-- Sample shipments
INSERT INTO shipments (shipment_id, origin_city, origin_country, dest_city, dest_country, quantity, transport_method, carrier, weight_kg, status, current_location, eta, departure_date, created_by)
VALUES
    ('EB-2024-0001', '深圳', '中国', '洛杉矶', '美国', 500, 'sea', 'COSCO', 2500.00, 'in_transit', '太平洋, 北纬25°, 东经140°', '2024-03-15 10:00:00', '2024-02-20 08:00:00', 2),
    ('EB-2024-0002', '深圳', '中国', '汉堡', '德国', 200, 'air', 'DHL', 800.00, 'customs', '法兰克福机场', '2024-03-10 14:00:00', '2024-03-01 06:00:00', 2),
    ('EB-2024-0003', '深圳', '中国', '迪拜', '阿联酋', 300, 'sea', 'MSC', 1500.00, 'pending', '深圳盐田港', '2024-03-20 09:00:00', NULL, 2),
    ('EB-2024-0004', '深圳', '中国', '新加坡', '新加坡', 150, 'air', 'FedEx', 450.00, 'delivered', '新加坡樟宜机场', '2024-02-28 16:00:00', '2024-02-25 10:00:00', 2),
    ('EB-2024-0005', '深圳', '中国', '鹿特丹', '荷兰', 1000, 'sea', 'CMA CGM', 5000.00, 'delayed', '马六甲海峡', '2024-03-05 08:00:00', '2024-02-15 12:00:00', 2)
ON CONFLICT (shipment_id) DO NOTHING;

-- Sample timeline entries
INSERT INTO shipment_timeline (shipment_id, stage, status, location, event_time, notes)
VALUES
    (1, '已揽收', 'completed', '深圳', '2024-02-20 08:00:00', '货物已揽收'),
    (1, '已出关', 'completed', '深圳盐田港', '2024-02-22 14:00:00', '海关放行'),
    (1, '运输中', 'in_progress', '太平洋', '2024-02-25 10:00:00', '船舶航行中'),
    (2, '已揽收', 'completed', '深圳', '2024-03-01 06:00:00', '货物已揽收'),
    (2, '已出关', 'completed', '深圳宝安机场', '2024-03-02 09:00:00', '海关放行'),
    (2, '清关中', 'in_progress', '法兰克福机场', '2024-03-03 11:00:00', '等待海关查验'),
    (4, '已揽收', 'completed', '深圳', '2024-02-25 10:00:00', '货物已揽收'),
    (4, '已出关', 'completed', '深圳宝安机场', '2024-02-26 08:00:00', '海关放行'),
    (4, '运输中', 'completed', '飞行中', '2024-02-26 10:00:00', '航班正常'),
    (4, '已签收', 'completed', '新加坡', '2024-02-28 16:00:00', '客户已签收'),
    (5, '已揽收', 'completed', '深圳', '2024-02-15 12:00:00', '货物已揽收'),
    (5, '已出关', 'completed', '深圳盐田港', '2024-02-17 10:00:00', '海关放行'),
    (5, '运输中', 'in_progress', '马六甲海峡', '2024-02-20 08:00:00', '因天气原因延误');

-- Sample risk alerts
INSERT INTO risk_alerts (shipment_id, alert_type, severity, title, message, status, user_id)
VALUES
    (5, 'delay', 'critical', '运单 EB-2024-0005 严重延误', '预计到达时间延迟5天，当前ETA: 2024-03-10', 'active', 2),
    (2, 'customs_issue', 'high', '运单 EB-2024-0002 海关查验', '货物在法兰克福海关被抽查，预计延迟2-3天', 'active', 2),
    (1, 'weather', 'medium', '运单 EB-2024-0001 航线天气预警', '太平洋航线预计有热带风暴，可能影响航行速度', 'active', 2),
    (4, 'document_missing', 'low', '运单 EB-2024-0004 文件待补充', '原产地证明文件即将到期，请及时更新', 'acknowledged', 2);

-- Sample shipping rates
INSERT INTO shipping_rates (transport_method, origin_region, dest_region, base_rate, currency, min_weight_kg, max_weight_kg, surcharge_rate, effective_from)
VALUES
    ('sea', '中国', '北美', 3.50, 'USD', 100, 10000, 5.00, '2024-01-01'),
    ('sea', '中国', '欧洲', 4.00, 'USD', 100, 10000, 5.00, '2024-01-01'),
    ('sea', '中国', '东南亚', 2.50, 'USD', 100, 10000, 3.00, '2024-01-01'),
    ('sea', '中国', '中东', 3.80, 'USD', 100, 10000, 4.00, '2024-01-01'),
    ('air', '中国', '北美', 12.00, 'USD', 10, 1000, 8.00, '2024-01-01'),
    ('air', '中国', '欧洲', 11.00, 'USD', 10, 1000, 8.00, '2024-01-01'),
    ('air', '中国', '东南亚', 8.00, 'USD', 10, 1000, 5.00, '2024-01-01'),
    ('air', '中国', '中东', 10.00, 'USD', 10, 1000, 6.00, '2024-01-01'),
    ('rail', '中国', '欧洲', 5.00, 'USD', 500, 5000, 3.00, '2024-01-01'),
    ('truck', '中国', '东南亚', 6.00, 'USD', 50, 2000, 4.00, '2024-01-01');
