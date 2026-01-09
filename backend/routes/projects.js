const express = require('express');
const router = express.Router();
const { Project, Customer, User } = require('../models');
const protect = require('../middleware/auth');

// @desc    Get all projects (filtered by user role and permissions)
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const userCustomerId = req.user.customer_id;

    let whereClause = {};

    // ✅ ADMINS: See everything - NO FILTER
    if (userRole === 'admin') {
      // No filter for admins
    }
    
    // ✅ CUSTOMER USERS: Only see their company's projects
    else if (userRole === 'customer') {
      if (!userCustomerId) {
        return res.json({
          success: true,
          count: 0,
          data: [],
          message: 'No customer association found'
        });
      }
      whereClause.customer_id = userCustomerId;
    }
    
    // ✅ PROJECT MANAGERS: Only see projects they manage
    else if (userRole === 'pm') {
      whereClause.project_manager_id = userId;
    }
    
    // ✅ FIELD TECHS & QA: See active projects only
    else if (userRole === 'field' || userRole === 'qa') {
      whereClause.status = 'in_progress';
    }

    const projects = await Project.findAll({
    where: whereClause,
    include: [
      {
        model: Customer,
        as: 'Customer',
        attributes: ['id', 'customer_name', 'contact_name', 'contact_email', 'contact_phone']
      }
    ],
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    count: projects.length,
    data: projects
  });
} catch (error) {
  console.error('Get projects error:', error);
  res.status(500).json({
    success: false,
    message: 'Error fetching projects',
    error: error.message
  });
}
});

// @desc    Get single project (with permission check)
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'customer_name', 'contact_name', 'contact_email', 'contact_phone']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Permission check
    const userRole = req.user.role;
    const userId = req.user.id;
    const userCustomerId = req.user.customer_id;

    // Admins can see everything
    if (userRole === 'admin') {
      return res.json({
        success: true,
        data: project
      });
    }

    // Customer users can only see their projects
    if (userRole === 'customer' && project.customer_id !== userCustomerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this project'
      });
    }

    // PMs can only see projects they manage
    if (userRole === 'pm' && project.project_manager_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this project'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
});

// @desc    Get modules for a specific project
// @route   GET /api/projects/:id/modules
// @access  Private
router.get('/:id/modules', protect, async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const projectId = req.params.id;

    console.log('📥 Loading modules for project:', projectId);

    const [results] = await sequelize.query(`
      SELECT 
        psm.id,
        psm.site,
        psm.installation_module_id,
        im.name as module_name,
        im.description as module_description,
        COALESCE(psm.total_required_photos, 0) as total_required_photos,
        COALESCE(psm.total_uploaded_photos, 0) as uploaded_photos
      FROM project_site_modules psm
      LEFT JOIN installation_modules im ON psm.installation_module_id = im.id
      WHERE psm.project_id = :projectId
      ORDER BY psm.site, psm.created_at
    `, {
      replacements: { projectId }
    });

    console.log('📊 Found modules:', results);

    // Group by site
    const modulesBySite = {
      site_A: [],
      site_B: []
    };

    results.forEach(row => {
      const siteKey = row.site === 'Site A' ? 'site_A' : 'site_B';
      modulesBySite[siteKey].push({
        id: row.id,
        installation_module_id: row.installation_module_id,
        module_name: row.module_name,
        module_description: row.module_description,
        total_required_photos: parseInt(row.total_required_photos) || 0,
        uploaded_photos: parseInt(row.uploaded_photos) || 0
      });
    });

    console.log('✅ Grouped modules:', modulesBySite);

    res.json({
      success: true,
      data: modulesBySite
    });

  } catch (error) {
    console.error('❌ Get project modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project modules',
      error: error.message
    });
  }
});

// @desc    Save module configuration for a project
// @route   POST /api/projects/:id/modules
// @access  Private (Admin/PM only)
router.post('/:id/modules', protect, async (req, res) => {
  try {
    // Check user role
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to configure modules'
      });
    }

    const { sequelize } = require('../models');
    const projectId = req.params.id;
    const { modules } = req.body;

    console.log('📥 Saving modules for project:', projectId);
    console.log('📦 Received modules:', JSON.stringify(modules, null, 2));

    // Validate input
    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid modules format. Expected an array.'
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Delete existing modules for this project
      await sequelize.query(
        'DELETE FROM project_site_modules WHERE project_id = :projectId',
        { 
          replacements: { projectId },
          transaction 
        }
      );

      console.log('🗑️ Deleted existing modules');

      // Insert each module
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        
        console.log(`📍 Inserting module ${i + 1}:`, module);
        
        // Get the required photo count for this module
        const [photoCountResult] = await sequelize.query(
          `SELECT COUNT(*) as photo_count 
           FROM photo_checklist_items 
           WHERE installation_module_id = :moduleId 
             AND is_active = true 
             AND is_required = true`,
          {
            replacements: { 
              moduleId: module.moduleId || module.installation_module_id 
            },
            transaction
          }
        );

        const requiredPhotoCount = parseInt(photoCountResult[0].photo_count) || 0;
        console.log(`📸 Module ${module.moduleId} requires ${requiredPhotoCount} photos`);

        // Insert the module with photo count
        await sequelize.query(
          `INSERT INTO project_site_modules 
           (project_id, site, installation_module_id, custom_label, status,
            total_required_photos, total_uploaded_photos, completion_percentage,
            started_at, created_at, updated_at)
           VALUES (:projectId, :site, :moduleId, :customLabel, 'not_started',
            :requiredPhotoCount, 0, 0, NOW(), NOW(), NOW())`,
          {
            replacements: {
              projectId,
              site: module.site,
              moduleId: module.moduleId || module.installation_module_id,
              customLabel: module.customLabel || '',
              requiredPhotoCount
            },
            transaction
          }
        );
      }

      console.log(`✅ Inserted ${modules.length} modules`);

      await transaction.commit();
      console.log('✅ Transaction committed successfully');

      res.json({
        success: true,
        message: 'Module configuration saved successfully'
      });

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Transaction rolled back:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Save modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save module configuration',
      error: error.message
    });
  }
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/PM only)
router.post('/', protect, async (req, res) => {
  try {
    // Check user role
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create projects'
      });
    }

    console.log('📥 RECEIVED PROJECT DATA:', req.body);

    const {
      project_code,
      project_name,
      customer_id,
      customer_poc,
      project_manager_id,
      qa_user_id,
      status,
      start_date,
      end_date,
      hours_estimate,
      site_a_name,
      site_a_address,
      site_a_location,
      site_a_latitude,
      site_a_longitude,
      site_b_name,
      site_b_address,
      site_b_location,
      site_b_latitude,
      site_b_longitude,
      scope_of_work,
      description
    } = req.body;

    // Validate required fields
    if (!project_code || !project_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide project code and name'
      });
    }

    // Check if project code already exists
    const existingProject = await Project.findOne({
      where: { project_code }
    });

    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists'
      });
    }

    const project = await Project.create({
      project_code,
      project_name,
      customer_id,
      customer_poc,
      project_manager_id,
      qa_user_id,
      status: status || 'pending',
      start_date,
      end_date,
      hours_estimate: hours_estimate || 0,
      hours_used: 0,
      site_a_name,
      site_a_address,
      site_a_location,
      site_a_latitude,
      site_a_longitude,
      site_b_name,
      site_b_address,
      site_b_location,
      site_b_latitude,
      site_b_longitude,
      scope_of_work,
      description
    });

    // Fetch with customer data
    const projectWithCustomer = await Project.findByPk(project.id, {
      include: [
        {
  model: Customer,
  as: 'customer',
  attributes: ['id', 'name', 'contact_name']
},
        {
          model: User,
          as: 'projectManager',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: projectWithCustomer
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/PM only)
router.put('/:id', protect, async (req, res) => {
  try {
    // Check user role
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update projects'
      });
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // PMs can only update their own projects (unless admin)
    if (req.user.role === 'pm' && project.project_manager_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    const {
      project_code,
      project_name,
      customer_id,
      customer_poc,
      project_manager_id,
      qa_user_id,
      status,
      start_date,
      end_date,
      hours_estimate,
      site_a_name,
      site_a_location,
      site_a_latitude,
      site_a_longitude,
      site_b_name,
      site_b_location,
      site_b_latitude,
      site_b_longitude,
      scope_of_work,
      description
    } = req.body;

    // Check if new project code conflicts with existing
    if (project_code && project_code !== project.project_code) {
      const existingProject = await Project.findOne({
        where: { project_code }
      });
      
      if (existingProject) {
        return res.status(400).json({
          success: false,
          message: 'Project code already exists'
        });
      }
    }

    await project.update({
      project_code: project_code || project.project_code,
      project_name: project_name || project.project_name,
      customer_id: customer_id !== undefined ? customer_id : project.customer_id,
      customer_poc: customer_poc !== undefined ? customer_poc : project.customer_poc,
      project_manager_id: project_manager_id !== undefined ? project_manager_id : project.project_manager_id,
      qa_user_id: qa_user_id !== undefined ? qa_user_id : project.qa_user_id,
      status: status || project.status,
      start_date: start_date !== undefined ? start_date : project.start_date,
      end_date: end_date !== undefined ? end_date : project.end_date,
      hours_estimate: hours_estimate !== undefined ? hours_estimate : project.hours_estimate,
      site_a_name: site_a_name !== undefined ? site_a_name : project.site_a_name,
      site_a_location: site_a_location !== undefined ? site_a_location : project.site_a_location,
      site_a_latitude: site_a_latitude !== undefined ? site_a_latitude : project.site_a_latitude,
      site_a_longitude: site_a_longitude !== undefined ? site_a_longitude : project.site_a_longitude,
      site_b_name: site_b_name !== undefined ? site_b_name : project.site_b_name,
      site_b_location: site_b_location !== undefined ? site_b_location : project.site_b_location,
      site_b_latitude: site_b_latitude !== undefined ? site_b_latitude : project.site_b_latitude,
      site_b_longitude: site_b_longitude !== undefined ? site_b_longitude : project.site_b_longitude,
      scope_of_work: scope_of_work !== undefined ? scope_of_work : project.scope_of_work,
      description: description !== undefined ? description : project.description
    });

    // Fetch updated project without customer association
    const updatedProject = await Project.findByPk(project.id);

    res.json({
      success: true,
      data: updatedProject
    });

    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Only admins can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete projects'
      });
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project',
      error: error.message
    });
  }
});

module.exports = router;