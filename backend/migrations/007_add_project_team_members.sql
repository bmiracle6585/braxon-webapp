-- ==========================================
-- PROJECT TEAM MEMBERS SYSTEM
-- Allows assigning employees to projects
-- ==========================================

-- 1. Add team tracking table
CREATE TABLE IF NOT EXISTS project_team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'technician', -- 'lead', 'technician', 'supervisor'
    assigned_date DATE NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prevent duplicate assignments
    UNIQUE KEY unique_project_user (project_id, user_id),
    
    INDEX idx_project_team_project (project_id),
    INDEX idx_project_team_user (user_id),
    INDEX idx_project_team_active (is_active),
    INDEX idx_project_team_dates (start_date, end_date)
);

-- 2. Add schedule/calendar events table
CREATE TABLE IF NOT EXISTS project_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    user_id INT NULL, -- NULL means whole team
    schedule_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    location VARCHAR(255) NULL, -- Can be different from project site
    notes TEXT NULL,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_schedule_project (project_id),
    INDEX idx_schedule_user (user_id),
    INDEX idx_schedule_date (schedule_date),
    INDEX idx_schedule_status (status)
);

-- 3. Add project visibility tracking
ALTER TABLE projects 
ADD COLUMN team_visibility ENUM('all', 'assigned_only', 'admin_only') DEFAULT 'assigned_only' AFTER status;

-- 4. Insert sample team assignments (optional - for testing)
-- Assign Blake Miracle (user_id=1) to first 3 active projects
INSERT INTO project_team_members (project_id, user_id, role, assigned_date, start_date) 
SELECT 
    id, 
    1, 
    'lead', 
    CURDATE(), 
    CURDATE() + INTERVAL FLOOR(RAND() * 7) DAY
FROM projects 
WHERE status = 'in_progress' 
LIMIT 3
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 5. Insert sample schedule (next 7 days)
INSERT INTO project_schedule (project_id, user_id, schedule_date, location, status)
SELECT 
    ptm.project_id,
    ptm.user_id,
    ptm.start_date + INTERVAL day_offset DAY,
    p.site_a_name,
    'scheduled'
FROM project_team_members ptm
JOIN projects p ON ptm.project_id = p.id
CROSS JOIN (
    SELECT 0 as day_offset UNION ALL
    SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
    SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) days
WHERE ptm.start_date IS NOT NULL
  AND ptm.start_date + INTERVAL day_offset DAY <= ptm.start_date + INTERVAL 6 DAY
  AND ptm.is_active = true
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;