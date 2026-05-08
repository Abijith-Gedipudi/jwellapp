
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

-- Insert default counters for every store
INSERT IGNORE INTO counters (id, store_id, name, category, products, is_active)
SELECT CONCAT(s.id, '_', c.id), s.id, c.name, c.category, c.products, TRUE
FROM stores s
JOIN (
    SELECT 'C1' id, 'C1 — Tops & Tikka' name, 'Gold' category, 'Tops, Champa Swaralu, Tika, Maati, Orders' products
    UNION ALL SELECT 'C2', 'C2 — Rings', 'Rings', 'Rings, Emerald Stock, Nakshi Micro, Orders'
    UNION ALL SELECT 'C3', 'C3 — Lockets', 'Lockets', 'Lockets, Black Beeds, Pustelu, Emerald Stock, Nakshi Micro, Orders'
    UNION ALL SELECT 'C4', 'C4 — Chains & Bracelets', 'Chains', 'Chains, Bracelet, Nazar Bandh, Hath Phool, Emerald Stock, Watch Strap, Orders'
    UNION ALL SELECT 'C5', 'C5 — Bangles', 'Bangles', 'Bangles, Baby Bangles, Orders'
    UNION ALL SELECT 'C6', 'C6 — PL Necklace', 'Plain Gold Necklace', 'PL Necklace, PL NCK Tops, PL Haram, PL Haram Top, Nakshi Micro, Back Chain, Orders'
    UNION ALL SELECT 'C7', 'C7 — Stone Necklace', 'Stone Necklace', 'ST Necklace, ST NCK Tops, ST Haram, ST Haram Tops, Emerald Stock, Back Chain, Orders'
    UNION ALL SELECT 'C8', 'C8 — Oddiynam & Idols', 'Oddiynam', 'Oddiynam, Arm Belt, Idols, Kumkum Bharani, Jada, Emerald Stock, Orders'
    UNION ALL SELECT 'C9', 'C9 — Diamond', 'Diamond', 'D Tops, D Rings, D Lockets, D NCK, D Haram, D Oddy, D Bangles, D Bracelet, D Nose Pin, D Frame, Black Beeds, D Armbelt, Platinum Jewellery, Orders'
    UNION ALL SELECT 'C10', 'C10 — Silver', 'Silver', 'Silver Jewellery, Silver Articles, Silver Bar, MMTC Silver, Silver Coins, 24KT Gold Foil'
    UNION ALL SELECT 'C11', 'C11 — 24KT Gold', 'Gold', '24KT Gold, Pure Gold'
    UNION ALL SELECT 'C12', 'C12 — MMTC Gold & Coins', 'Gold', 'MMTC Gold, PG Coins, Kasu'
    UNION ALL SELECT 'C13', 'C13 — Multi Products', 'Multi Products', 'Multi Products'
    UNION ALL SELECT 'C14', 'C14 — Jewellery Repair', 'Repair', 'Jewellery Repair'
    UNION ALL SELECT 'C15', 'C15 — Gem Stones & Malas', 'Gem Stones', 'Gem Stones, Beeds Malas'
    UNION ALL SELECT 'C16', 'C16 — Gem Packets', 'Gem Stones', 'Gem Packet'
    UNION ALL SELECT 'C17', 'C17 — Nakshi Haram', 'Nakshi', 'Nak Haram, Nak Necklace, Nak Bangles'
) c;
