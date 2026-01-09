-- =============================================
-- BRAXON PHOTO MODULES - DATABASE SCHEMA
-- File: 01-photo-modules-schema.sql
-- =============================================

-- Drop existing tables if they exist (cascade to remove dependencies)
DROP TABLE IF EXISTS daily_report_photos CASCADE;
DROP TABLE IF EXISTS project_checklist_progress CASCADE;
DROP TABLE IF EXISTS daily_report_work_entries CASCADE;
DROP TABLE IF EXISTS project_site_modules CASCADE;
DROP TABLE IF EXISTS photo_checklist_items CASCADE;
DROP TABLE IF EXISTS installation_modules CASCADE;

-- Create daily_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  site VARCHAR(10),
  submitted_by_user_id INTEGER REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  crew_time JSONB,
  total_hours DECIMAL(5,2),
  weather_conditions VARCHAR(100),
  customer_contact BOOLEAN DEFAULT false,
  customer_notes TEXT,
  general_notes TEXT,
  issues JSONB,
  status VARCHAR(20) DEFAULT 'submitted',
  reviewed_by_user_id INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1. INSTALLATION MODULE CATEGORIES (Top Level)
CREATE TABLE installation_modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. PHOTO CHECKLIST ITEMS (Subcategories with specific requirements)
CREATE TABLE photo_checklist_items (
  id SERIAL PRIMARY KEY,
  installation_module_id INTEGER REFERENCES installation_modules(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  required_photo_count INTEGER DEFAULT 1,
  display_order INTEGER,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. PROJECT SITE MODULES (Instance per project/site)
CREATE TABLE project_site_modules (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  site VARCHAR(10) NOT NULL,
  installation_module_id INTEGER REFERENCES installation_modules(id),
  custom_label VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending',
  total_required_photos INTEGER,
  total_uploaded_photos INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. PROJECT CHECKLIST ITEM PROGRESS (Track each subcategory)
CREATE TABLE project_checklist_progress (
  id SERIAL PRIMARY KEY,
  project_site_module_id INTEGER REFERENCES project_site_modules(id) ON DELETE CASCADE,
  photo_checklist_item_id INTEGER REFERENCES photo_checklist_items(id),
  required_photo_count INTEGER,
  uploaded_photo_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. DAILY REPORT WORK ENTRIES (Free-form updates)
CREATE TABLE daily_report_work_entries (
  id SERIAL PRIMARY KEY,
  daily_report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
  project_site_module_id INTEGER REFERENCES project_site_modules(id),
  site VARCHAR(10),
  module_name VARCHAR(200),
  work_performed TEXT NOT NULL,
  accomplishments TEXT,
  issues_encountered TEXT,
  items_completed VARCHAR(100),
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. DAILY REPORT PHOTOS (Progressive documentation)
CREATE TABLE daily_report_photos (
  id SERIAL PRIMARY KEY,
  daily_report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
  project_site_module_id INTEGER REFERENCES project_site_modules(id),
  photo_checklist_item_id INTEGER REFERENCES photo_checklist_items(id),
  work_entry_id INTEGER REFERENCES daily_report_work_entries(id),
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  caption TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  taken_at TIMESTAMP,
  site VARCHAR(10),
  module_name VARCHAR(200),
  checklist_item_name VARCHAR(200),
  uploaded_by_user_id INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_checklist_items_module ON photo_checklist_items(installation_module_id);
CREATE INDEX idx_site_modules_project ON project_site_modules(project_id, site);
CREATE INDEX idx_checklist_progress_module ON project_checklist_progress(project_site_module_id);
CREATE INDEX idx_work_entries_report ON daily_report_work_entries(daily_report_id);
CREATE INDEX idx_photos_module ON daily_report_photos(project_site_module_id);
CREATE INDEX idx_photos_checklist_item ON daily_report_photos(photo_checklist_item_id);
CREATE INDEX idx_daily_reports_project ON daily_reports(project_id, report_date);

-- Output success message
SELECT 'Schema tables created successfully!' as status;