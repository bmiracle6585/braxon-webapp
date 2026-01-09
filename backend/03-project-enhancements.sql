-- =============================================
-- BRAXON PHOTO MODULES - PROJECT ENHANCEMENTS
-- File: 03-project-enhancements.sql
-- =============================================

-- Add hours budget tracking to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS hours_budgeted DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS hours_used DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_threshold_percentage DECIMAL(5,2) DEFAULT 90.0;

-- Add comment for documentation
COMMENT ON COLUMN projects.hours_budgeted IS 'Total hours allocated for project completion';
COMMENT ON COLUMN projects.hours_used IS 'Hours used so far from daily reports';
COMMENT ON COLUMN projects.bonus_threshold_percentage IS 'Percentage threshold for bonus eligibility (default 90%)';

-- Output success message
SELECT 'Project enhancements added successfully!' as status;