
CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counters (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    products TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL,
    cre_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    purpose VARCHAR(100),
    category VARCHAR(100),
    counter_id VARCHAR(50),
    outcome VARCHAR(50) DEFAULT 'Browsing',
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    bill_number VARCHAR(100),
    loss_reason VARCHAR(255),
    remarks TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (counter_id) REFERENCES counters(id)
);

CREATE TABLE IF NOT EXISTS admin_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
);

-- Insert default admin password (change after first login)
INSERT IGNORE INTO admin_settings (setting_key, setting_value) VALUES ('adminPass', 'manepally@admin2025');

-- Insert default stores based on previous HTML setup
INSERT IGNORE INTO stores (id, name, pin, is_active) VALUES 
('s1', 'Manepally Main', '1111', TRUE),
('s2', 'Manepally Jubilee', '2222', TRUE),
('s3', 'Manepally Dilsukhnagar', '3333', TRUE),
('s4', 'Manepally Kukatpally', '4444', TRUE),
('s5', 'Manepally Mehdipatnam', '5555', TRUE),
('s6', 'Manepally Secunderabad', '6666', TRUE),
('s7', 'Manepally Miyapur', '7777', TRUE);

-- We won't insert default counters here, they can be added via Admin Dashboard
