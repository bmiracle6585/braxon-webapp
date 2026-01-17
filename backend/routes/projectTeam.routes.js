const express = require('express');
const router = express.Router();
const { ProjectTeamMember, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET team members for a project
 */
router.get('/project/:projectId/members', authMiddleware, async (req, res) => {
  const { projectId } = req.params;

  try {
    const members = await ProjectTeamMember.findAll({
      where: {
        project_id: projectId,
        is_active: true
      },
      include: [{
        model: User,
        attributes: ['id', 'full_name', 'email', 'role']
      }],
      order: [['id', 'ASC']]
    });

    return res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (err) {
    console.error('GET team members error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * ADD team member to project
 */
router.post('/project/:projectId/members', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  const { user_id, role = 'technician', notes = '' } = req.body;

  try {
    const existing = await ProjectTeamMember.findOne({
      where: {
        project_id: projectId,
        user_id,
        is_active: true
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already assigned to this project'
      });
    }

    const member = await ProjectTeamMember.create({
      project_id: projectId,
      user_id,
      role,
      notes,
      is_active: true
    });

    return res.json({
      success: true,
      message: 'Team member added successfully',
      data: member
    });
  } catch (err) {
    console.error('ADD team member error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * REMOVE team member from project (soft delete)
 */
router.delete('/project/:projectId/members/:userId', authMiddleware, async (req, res) => {
  const { projectId, userId } = req.params;

  try {
    const [affected] = await ProjectTeamMember.update(
      { is_active: false },
      {
        where: {
          project_id: projectId,
          user_id: userId,
          is_active: true
        }
      }
    );

    if (!affected) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found or already removed'
      });
    }

    return res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (err) {
    console.error('REMOVE team member error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

