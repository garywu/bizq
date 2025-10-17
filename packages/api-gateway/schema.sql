-- API Gateway Database Schema
-- Cloudflare D1 (SQLite compatible)

-- Route configurations
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    target TEXT NOT NULL,
    methods TEXT NOT NULL DEFAULT 'GET,POST,PUT,DELETE',
    rate_limit INTEGER DEFAULT 100,
    auth_required BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API keys for authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    client_id TEXT,
    rate_limit INTEGER DEFAULT 1000,
    permissions TEXT, -- JSON array of allowed paths/operations
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    expires_at DATETIME
);

-- Request logs for analytics
CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- in milliseconds
    client_ip TEXT,
    user_agent TEXT,
    api_key_id INTEGER,
    route_id INTEGER,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Rate limit violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    client_ip TEXT NOT NULL,
    route_id INTEGER,
    violation_count INTEGER DEFAULT 1,
    blocked_until DATETIME,
    FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Service health checks
CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    check_type TEXT NOT NULL, -- 'database', 'cache', 'external'
    status TEXT NOT NULL, -- 'healthy', 'unhealthy'
    latency INTEGER, -- in milliseconds
    error_message TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_path ON routes(path);
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(active);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_request_logs_api_key ON request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_route ON request_logs(route_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(client_ip);
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(checked_at);

-- Default routes for common services
INSERT OR IGNORE INTO routes (path, target, methods, rate_limit, auth_required) VALUES
('/api/domains/*', 'https://domain-suggestions.bizq.workers.dev', 'GET,POST', 100, false),
('/api/search/*', 'https://search-suggestions.bizq.workers.dev', 'GET,POST', 50, false),
('/api/auth/*', 'https://auth.bizq.workers.dev', 'GET,POST,PUT,DELETE', 20, false),
('/health', 'https://health.bizq.workers.dev', 'GET', 1000, false);

-- Sample API key for development
INSERT OR IGNORE INTO api_keys (key_hash, name, client_id, rate_limit, permissions, expires_at) VALUES
('dev-api-key-hash', 'Development API Key', 'dev-client', 1000, '["/api/*"]', '2025-12-31 23:59:59');