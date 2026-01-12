// =============================================
// DAILY REPORTS API ROUTES
// Handles daily report submission and photo uploads
// =============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { 
  DailyReport, 
  DailyReportWorkEntry, 
  DailyReportPhoto,
  ProjectSiteModule,
  ProjectChecklistProgress,
  Project,
  User
} = require('../models');
const { sequelize } = require('../config/database');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { projectId, reportId } = req.params;
    const uploadPath = path.join(__dirname, '../uploads/projects', projectId, 'daily-reports', reportId || 'temp');
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, HEIC)'));
    }
  }
});

router.get('/project/:projectId/latest', protect, async (req, res) => {
  const { projectId } = req.params;

  try {
    const latestReport = await DailyReport.findOne({
      where: { 
        project_id: projectId,
        status: 'submitted' // Only show submitted reports
      },
      include: [
    {
        model: User,
        as: 'submittedBy',
        attributes: ['id', 'full_name', 'email']
    }
],
      order: [
        ['report_date', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: 1
    });

    if (!latestReport) {
      return res.json({
        success: true,
        data: null,
        message: 'No daily reports submitted yet'
      });
    }

    res.json({
      success: true,
      data: latestReport
    });
  } catch (error) {
    console.error('Get latest report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve latest report',
      error: error.message
    });
  }
});

// @route   POST /api/daily-reports
// @desc    Create new daily report
// @access  Private (Field users)
router.post('/', protect, async (req, res) => {
  const {
    project_id,
    report_date,
    site,
    crew_time,
    weather_conditions,
    customer_contact,
    customer_notes,
    general_notes,
    issues
  } = req.body;

  try {
    const totalHours = crew_time ? crew_time.reduce((sum, member) => sum + parseFloat(member.hours || 0), 0) : 0;

    const report = await DailyReport.create({
      project_id,
      report_date,
      site,
      submitted_by_user_id: req.user.id,
      crew_time,
      total_hours: totalHours,
      weather_conditions,
      customer_contact,
      customer_notes,
      general_notes,
      issues,
      status: 'draft'
    });

    res.json({
      success: true,
      message: 'Daily report created',
      data: report
    });
  } catch (error) {
    console.error('Create daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create daily report',
      error: error.message
    });
  }
});

// @route   POST /api/daily-reports/:reportId/work-entries
// @desc    Add work entry to daily report
// @access  Private
router.post('/:reportId/work-entries', protect, async (req, res) => {
  const { reportId } = req.params;
  const {
    project_site_module_id,
    site,
    module_name,
    work_performed,
    accomplishments,
    issues_encountered,
    items_completed
  } = req.body;

  try {
    const workEntry = await DailyReportWorkEntry.create({
      daily_report_id: reportId,
      project_site_module_id,
      site,
      module_name,
      work_performed,
      accomplishments,
      issues_encountered,
      items_completed
    });

    res.json({
      success: true,
      message: 'Work entry added',
      data: workEntry
    });
  } catch (error) {
    console.error('Add work entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add work entry',
      error: error.message
    });
  }
});

// @route   POST /api/daily-reports/:reportId/photos
// @desc    Upload photos for daily report
// @access  Private
router.post('/:reportId/photos', protect, upload.array('photos', 20), async (req, res) => {
  const { reportId } = req.params;
  const {
    project_site_module_id,
    photo_checklist_item_id,
    work_entry_id,
    site,
    module_name,
    checklist_item_name,
    captions // JSON string array
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const uploadedPhotos = [];
    const captionsArray = captions ? JSON.parse(captions) : [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = captionsArray[i] || '';

      const photo = await DailyReportPhoto.create({
        daily_report_id: reportId,
        project_site_module_id,
        photo_checklist_item_id,
        work_entry_id,
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        caption,
        site,
        module_name,
        checklist_item_name,
        uploaded_by_user_id: req.user.id,
        taken_at: new Date()
      }, { transaction });

      uploadedPhotos.push(photo);
    }

    // Update checklist progress if applicable
    if (photo_checklist_item_id) {
      const progress = await ProjectChecklistProgress.findOne({
        where: {
          project_site_module_id,
          photo_checklist_item_id
        }
      });

      if (progress) {
        progress.uploaded_photo_count += req.files.length;
        progress.is_completed = progress.uploaded_photo_count >= progress.required_photo_count;
        await progress.save({ transaction });
      }
    }

    // Update module photo count
    if (project_site_module_id) {
      const module = await ProjectSiteModule.findByPk(project_site_module_id);
      if (module) {
        module.total_uploaded_photos += req.files.length;
        module.completion_percentage = Math.round(
          (module.total_uploaded_photos / module.total_required_photos) * 100
        );
        if (module.status === 'pending') module.status = 'in_progress';
        await module.save({ transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `${uploadedPhotos.length} photos uploaded successfully`,
      data: uploadedPhotos
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Upload photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
});

// @route   PUT /api/daily-reports/:reportId/submit
// @desc    Submit daily report (change from draft to submitted)
// @access  Private
router.put('/:reportId/submit', protect, async (req, res) => {
  const { reportId } = req.params;

  const transaction = await sequelize.transaction();

  try {
    const report = await DailyReport.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.submitted_by_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this report'
      });
    }

    report.status = 'submitted';
    report.submitted_at = new Date();
    await report.save({ transaction });

    // Update project hours_used
    const project = await Project.findByPk(report.project_id);
    if (project && report.total_hours) {
      project.hours_used = (parseFloat(project.hours_used) || 0) + parseFloat(report.total_hours);
      await project.save({ transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
});

// @route   GET /api/daily-reports/project/:projectId
// @desc    Get all daily reports for a project
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  const { projectId } = req.params;

  try {
    const reports = await DailyReport.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: 'submittedBy',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: DailyReportWorkEntry,
          as: 'workEntries'
        }
      ],
      order: [['report_date', 'DESC']]
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
      error: error.message
    });
  }
});

// @route   DELETE /api/daily-reports/:reportId
// @desc    Delete daily report (Admin/PM only)
// @access  Private (Admin/PM)
router.delete('/:reportId', protect, async (req, res) => {
  const { reportId } = req.params;

  try {
    // Check if user is admin or PM
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and project managers can delete reports'
      });
    }

    const report = await DailyReport.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Delete associated photos and work entries (cascade should handle this, but explicit is better)
    await DailyReportPhoto.destroy({ where: { daily_report_id: reportId } });
    await DailyReportWorkEntry.destroy({ where: { daily_report_id: reportId } });
    
    // Delete the report
    await report.destroy();

    res.json({
      success: true,
      message: 'Daily report deleted successfully'
    });
  } catch (error) {
    console.error('Delete daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily report',
      error: error.message
    });
  }
});
// @route   GET /api/daily-reports/project/:projectId/concerns
// @desc    Get concerns/issues for a project (placeholder)
// @access  Private
router.get('/project/:projectId/concerns', protect, async (req, res) => {
  try {
    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Get concerns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve concerns',
      error: error.message
    });
  }
});

module.exports = router;
