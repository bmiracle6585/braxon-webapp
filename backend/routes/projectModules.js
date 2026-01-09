// =============================================
// PROJECT SITE MODULES API ROUTES
// Handles module assignment to projects
// =============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
// Import all models and sequelize from the index
const db = require('../models');
const ProjectSiteModule = db.ProjectSiteModule;
const ProjectChecklistProgress = db.ProjectChecklistProgress;
const InstallationModule = db.InstallationModule;
const PhotoChecklistItem = db.PhotoChecklistItem;
const sequelize = db.sequelize;

// @route   POST /api/projects/:projectId/modules
// @desc    Assign modules to project sites
// @access  Private (Admin/PM only)
router.post('/:projectId/modules', protect, async (req, res) => {
  const { projectId } = req.params;
  const { modules } = req.body; // Array of {site, moduleId, customLabel}

  // Check authorization
  if (!['admin', 'pm'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to assign modules'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // ✅ DELETE ALL EXISTING MODULES FOR THIS PROJECT FIRST
    await ProjectSiteModule.destroy({
      where: { project_id: projectId },
      transaction
    });

    const createdModules = [];

    for (const moduleData of modules) {
      const { site, moduleId, customLabel } = moduleData;

      // Get module details and checklist items
      const installationModule = await InstallationModule.findByPk(moduleId, {
        include: [{
          model: PhotoChecklistItem,
          as: 'checklistItems',
          where: { is_active: true },
          required: false
        }]
      });

      if (!installationModule) continue;

      // Calculate total required photos
      const totalPhotos = installationModule.checklistItems.reduce(
        (sum, item) => sum + item.required_photo_count, 0
      );

      // Create project site module
      const projectModule = await ProjectSiteModule.create({
        project_id: projectId,
        site: site,
        installation_module_id: moduleId,
        custom_label: customLabel || installationModule.name,
        total_required_photos: totalPhotos,
        status: 'pending'
      }, { transaction });

      // Create progress tracking for each checklist item
      for (const item of installationModule.checklistItems) {
        await ProjectChecklistProgress.create({
          project_site_module_id: projectModule.id,
          photo_checklist_item_id: item.id,
          required_photo_count: item.required_photo_count,
          uploaded_photo_count: 0,
          is_completed: false
        }, { transaction });
      }

      createdModules.push(projectModule);
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `${createdModules.length} modules assigned successfully`,
      data: createdModules
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Assign modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign modules',
      error: error.message
    });
  }
});

// @route   GET /api/projects/:projectId/modules
// @desc    Get all modules for a project (both sites)
// @access  Private
router.get('/:projectId/modules', protect, async (req, res) => {
  const { projectId } = req.params;

  try {
    const modules = await ProjectSiteModule.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: InstallationModule,
          as: 'installationModule',
          attributes: ['id', 'name', 'description', 'category']
        },
        {
          model: ProjectChecklistProgress,
          as: 'checklistProgress',
          include: [{
            model: PhotoChecklistItem,
            as: 'checklistItem',
            attributes: ['id', 'item_name', 'required_photo_count', 'display_order']
          }],
          order: [['checklistItem', 'display_order', 'ASC']]
        }
      ],
      order: [['site', 'ASC'], ['created_at', 'ASC']]
    });

    // Group by site
    const siteA = modules.filter(m => m.site === 'Site A');
    const siteB = modules.filter(m => m.site === 'Site B');

    res.json({
      success: true,
      data: {
        site_A: siteA,
        site_B: siteB,
        total: modules.length
      }
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

// @route   GET /api/projects/:projectId/modules/:moduleId
// @desc    Get single project module with detailed progress
// @access  Private
router.get('/:projectId/modules/:moduleId', protect, async (req, res) => {
  const { moduleId } = req.params;

  try {
    const module = await ProjectSiteModule.findByPk(moduleId, {
      include: [
        {
          model: InstallationModule,
          as: 'installationModule'
        },
        {
          model: ProjectChecklistProgress,
          as: 'checklistProgress',
          include: [{
            model: PhotoChecklistItem,
            as: 'checklistItem'
          }],
          order: [['checklistItem', 'display_order', 'ASC']]
        }
      ]
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

// @route   DELETE /api/projects/:projectId/modules/:moduleId
// @desc    Remove module from project
// @access  Private (Admin/PM only)
router.delete('/:projectId/modules/:moduleId', protect, async (req, res) => {
  const { moduleId } = req.params;

  if (!['admin', 'pm'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete modules'
    });
  }

  try {
    const module = await ProjectSiteModule.findByPk(moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    await module.destroy(); // Cascade will delete progress records

    res.json({
      success: true,
      message: 'Module removed successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete module',
      error: error.message
    });
  }
});

module.exports = router;