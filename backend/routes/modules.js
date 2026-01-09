// =============================================
// INSTALLATION MODULES API ROUTES
// Handles module master list and photo checklists
// =============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { InstallationModule, PhotoChecklistItem } = require('../models');

// @route   GET /api/modules
// @desc    Get all installation modules with checklist items
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const modules = await InstallationModule.findAll({
      where: { is_active: true },
      include: [{
        model: PhotoChecklistItem,
        as: 'checklistItems',
        where: { is_active: true },
        required: false,
        order: [['display_order', 'ASC']]
      }],
      order: [['display_order', 'ASC']]
    });

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve modules',
      error: error.message
    });
  }
});

// @route   GET /api/modules/:id
// @desc    Get single module with checklist items
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const module = await InstallationModule.findByPk(req.params.id, {
      include: [{
        model: PhotoChecklistItem,
        as: 'checklistItems',
        where: { is_active: true },
        required: false,
        order: [['display_order', 'ASC']]
      }]
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve module',
      error: error.message
    });
  }
});

// @route   GET /api/projects/:projectId/modules
// @desc    Get modules assigned to a specific project (by site)
// @access  Private
router.get('/projects/:projectId/modules', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Raw SQL query since you're using direct PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const query = `
      SELECT 
        psm.id,
        psm.site,
        psm.job_module_id,
        jm.name as module_name,
        jm.description as module_description,
        COUNT(DISTINCT pci.id) as total_required_photos,
        0 as uploaded_photos
      FROM project_site_modules psm
      LEFT JOIN job_modules jm ON psm.job_module_id = jm.id
      LEFT JOIN photo_checklist_items pci ON pci.installation_module_id = jm.id 
        AND pci.is_active = true 
        AND pci.is_required = true
      WHERE psm.project_id = $1
        AND psm.is_active = true
      GROUP BY psm.id, psm.site, psm.job_module_id, jm.name, jm.description
      ORDER BY psm.site, psm.display_order
    `;
    
    const result = await pool.query(query, [projectId]);
    
    // Group by site
    const modulesBySite = {
      site_A: [],
      site_B: []
    };
    
    result.rows.forEach(row => {
      const siteKey = row.site === 'Site A' ? 'site_A' : 'site_B';
      modulesBySite[siteKey].push({
        id: row.id,
        module_name: row.module_name,
        module_description: row.module_description,
        total_required_photos: parseInt(row.total_required_photos) || 0,
        uploaded_photos: row.uploaded_photos
      });
    });
    
    res.json({
      success: true,
      data: modulesBySite
    });
    
  } catch (error) {
    console.error('Get project modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project modules',
      error: error.message
    });
  }
});

module.exports = router;