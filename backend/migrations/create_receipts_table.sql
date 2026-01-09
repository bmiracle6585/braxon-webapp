-- ===========================
-- RECEIPTS SYSTEM TABLES
-- ===========================

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Purchase details
  purchase_date DATE NOT NULL,
  vendor_name VARCHAR(255),
  category VARCHAR(50) NOT NULL, -- 'tools', 'materials', 'food_water', 'lodging', 'fuel', 'other'
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment info
  payment_method VARCHAR(50) DEFAULT 'company_card', -- 'company_card', 'personal_reimbursement'
  card_last_four VARCHAR(4),
  
  -- Receipt image
  photo_url VARCHAR(500),
  photo_thumbnail_url VARCHAR(500),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'exported'
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- QuickBooks integration
  exported_to_qb BOOLEAN DEFAULT FALSE,
  qb_export_date TIMESTAMP,
  qb_transaction_id VARCHAR(100),
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Email distribution list
CREATE TABLE IF NOT EXISTS receipt_email_recipients (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- Receipt attachments (if multiple photos needed)
CREATE TABLE IF NOT EXISTS receipt_attachments (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_receipts_project ON receipts(project_id);
CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(purchase_date);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_category ON receipts(category);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_receipt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipts_update_timestamp
BEFORE UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION update_receipt_timestamp();

-- Generate unique receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  year_prefix VARCHAR;
BEGIN
  year_prefix := 'RCP-' || TO_CHAR(NOW(), 'YYYY') || '-';
  
  SELECT year_prefix || LPAD((COALESCE(MAX(SUBSTRING(receipt_number FROM '\d+$')::INTEGER), 0) + 1)::TEXT, 5, '0')
  INTO new_number
  FROM receipts
  WHERE receipt_number LIKE year_prefix || '%';
  
  IF new_number IS NULL THEN
    new_number := year_prefix || '00001';
  END IF;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Insert default email recipients (update with your emails)
INSERT INTO receipt_email_recipients (email, name) VALUES
('accounting@braxonindustries.com', 'Accounting Department'),
('blake@braxonindustries.com', 'Blake Miracle')
ON CONFLICT (email) DO NOTHING;

-- Add sample data comment
COMMENT ON TABLE receipts IS 'Field expense receipts for project cost tracking and QuickBooks reconciliation';