-- Domain checking database schema for Cloudflare D1

-- Store domain availability checks
CREATE TABLE IF NOT EXISTS domain_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    tld TEXT NOT NULL DEFAULT 'com',
    available BOOLEAN NOT NULL,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'api', -- 'api', 'bulk', 'whois'
    UNIQUE(domain, tld)
);

-- Store popular TLDs
CREATE TABLE IF NOT EXISTS tlds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tld TEXT NOT NULL UNIQUE,
    popularity INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default TLDs
INSERT OR IGNORE INTO tlds (tld, popularity) VALUES
    ('com', 100),
    ('io', 80),
    ('co', 60),
    ('net', 40),
    ('org', 30),
    ('dev', 25),
    ('app', 20),
    ('ai', 15),
    ('tech', 12),
    ('online', 10);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_checks_domain ON domain_checks(domain);
CREATE INDEX IF NOT EXISTS idx_domain_checks_tld ON domain_checks(tld);
CREATE INDEX IF NOT EXISTS idx_domain_checks_available ON domain_checks(available);
CREATE INDEX IF NOT EXISTS idx_domain_checks_checked_at ON domain_checks(checked_at);