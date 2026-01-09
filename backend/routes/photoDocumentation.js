const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Get modules and checklist items for a project site
// @route   GET /api/photo-documentation/project/:projectId?site=a
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const projectId = req.params.projectId;
    const site = req.query.site || 'a'; // Default to Site A
    const siteLabel = `Site ${site.toUpperCase()}`;

    console.log(`📸 Loading photo documentation for project ${projectId}, ${siteLabel}`);

    // Get modules for this project and site with their checklist items
    const [modules] = await sequelize.query(`
      SELECT 
        psm.id as project_module_id,
        psm.site,
        psm.installation_module_id,
        im.name as module_name,
        im.description as module_description,
        psm.total_required_photos,
        psm.total_uploaded_photos,
        psm.completion_percentage,
        
        -- Checklist items
        pci.id as checklist_item_id,
        pci.item_name,
        pci.description as item_description,
        pci.required_photo_count,
        pci.display_order,
        pci.is_required,
        
        -- Count uploaded photos for this checklist item
        COUNT(DISTINCT drp.id) as uploaded_count
        
      FROM project_site_modules psm
      JOIN installation_modules im ON psm.installation_module_id = im.id
      LEFT JOIN photo_checklist_items pci ON pci.installation_module_id = im.id 
        AND pci.is_active = true
      LEFT JOIN daily_report_photos drp ON drp.project_site_module_id = psm.id 
        AND drp.checklist_item_id = pci.id
      
      WHERE psm.project_id = :projectId
        AND psm.site = :site
        AND psm.is_active = true
      
      GROUP BY 
        psm.id, psm.site, psm.installation_module_id, 
        im.name, im.description,
        psm.total_required_photos, psm.total_uploaded_photos, psm.completion_percentage,
        pci.id, pci.item_name, pci.description, 
        pci.required_photo_count, pci.display_order, pci.is_required
      
      ORDER BY psm.id, pci.display_order
    `, {
      replacements: { projectId, site: siteLabel }
    });

    // Group checklist items under their modules
    const modulesMap = {};
    
    modules.forEach(row => {
      const moduleId = row.project_module_id;
      
      if (!modulesMap[moduleId]) {
        modulesMap[moduleId] = {
          project_module_id: row.project_module_id,
          site: row.site,
          installation_module_id: row.installation_module_id,
          module_name: row.module_name,
          module_description: row.module_description,
          total_required_photos: row.total_required_photos,
          total_uploaded_photos: row.total_uploaded_photos,
          completion_percentage: row.completion_percentage,
          checklist_items: []
        };
      }
      
      if (row.checklist_item_id) {
        modulesMap[moduleId].checklist_items.push({
          id: row.checklist_item_id,
          item_name: row.item_name,
          description: row.item_description,
          required_photo_count: row.required_photo_count || 1,
          uploaded_count: parseInt(row.uploaded_count) || 0,
          is_required: row.is_required,
          display_order: row.display_order
        });
      }
    });

    const result = Object.values(modulesMap);
    
    console.log(`✅ Found ${result.length} modules with checklist items`);

    res.json({
      success: true,
      site: siteLabel,
      data: result
    });

  } catch (error) {
    console.error('❌ Get photo documentation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load photo documentation',
      error: error.message
    });
  }
});

// @desc    Upload photo for a checklist item
// @route   POST /api/photo-documentation/upload
// @access  Private
router.post('/upload', protect, async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const { 
      project_id, 
      project_site_module_id, 
      checklist_item_id, 
      photo_url, 
      notes 
    } = req.body;

    console.log('📤 Uploading photo:', { project_site_module_id, checklist_item_id });

    // Insert photo record
    const [result] = await sequelize.query(`
      INSERT INTO daily_report_photos 
        (project_id, project_site_module_id, checklist_item_id, photo_url, notes, uploaded_by, uploaded_at)
      VALUES 
        (:project_id, :project_site_module_id, :checklist_item_id, :photo_url, :notes, :uploaded_by, NOW())
      RETURNING id
    `, {
      replacements: {
        project_id,
        project_site_module_id,
        checklist_item_id,
        photo_url,
        notes: notes || null,
        uploaded_by: req.user.id
      }
    });

    // Update module upload count
    await sequelize.query(`
      UPDATE project_site_modules 
      SET total_uploaded_photos = total_uploaded_photos + 1,
          completion_percentage = ROUND((total_uploaded_photos::numeric / NULLIF(total_required_photos, 0)) * 100)
      WHERE id = :project_site_module_id
    `, {
      replacements: { project_site_module_id }
    });

    console.log('✅ Photo uploaded successfully');

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photo_id: result[0].id
    });

  } catch (error) {
    console.error('❌ Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
});

module.exports = router;