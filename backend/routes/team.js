const authMiddleware = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require('../models');
const { ProjectTeamMember, User, Project, ProjectSchedule } = db;
const { Op } = require('sequelize');

// ==========================================
// GET USER'S ASSIGNED PROJECTS
// ==========================================
router.get('/my-projects/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const assignments = await ProjectTeamMember.findAll({
            where: { 
                user_id: userId,
                is_active: true
            },
            include: [
                {
                    model: Project,
                    as: 'Project',
                    where: {
                        status: {
                            [Op.in]: ['in_progress', 'pending']
                        }
                    }
                }
            ],
            order: [['start_date', 'ASC']]
        });

        res.json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching user projects:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch projects' 
        });
    }
});

// ==========================================
// GET USER'S SCHEDULE (Next 7 Days)
// ==========================================
router.get('/my-schedule/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const schedule = await ProjectSchedule.findAll({
            where: {
                user_id: userId,
                schedule_date: {
                    [Op.between]: [today, nextWeek]
                },
                status: {
                    [Op.in]: ['scheduled', 'confirmed']
                }
            },
            include: [
                {
                    model: Project,
                    as: 'Project',
                    attributes: ['id', 'project_name', 'project_code', 'site_a_name', 'site_a_address']
                }
            ],
            order: [['schedule_date', 'ASC'], ['start_time', 'ASC']]
        });

        res.json({
            success: true,
            count: schedule.length,
            data: schedule
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch schedule' 
        });
    }
});

// ==========================================
// GET TEAM MEMBERS FOR PROJECT (Admin/PM)
// ==========================================
router.get('/project/:projectId/members', async (req, res) => {
    try {
        const { projectId } = req.params;

        const members = await ProjectTeamMember.findAll({
            where: { 
                project_id: projectId,
                is_active: true
            },
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'full_name', 'email', 'role']
                }
            ],
            order: [['role', 'ASC'], ['assigned_date', 'ASC']]
        });

        res.json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch team members' 
        });
    }
});

// ==========================================
// ADD TEAM MEMBER TO PROJECT
// ==========================================
router.post('/project/:projectId/members', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { user_id, role, start_date, end_date, notes } = req.body;

        // Check if already assigned
        const existing = await ProjectTeamMember.findOne({
            where: { project_id: projectId, user_id }
        });

        if (existing) {
            // Reactivate if inactive
            if (!existing.is_active) {
                await existing.update({ is_active: true });
                
                // Include user data in response
                const updated = await ProjectTeamMember.findOne({
                    where: { id: existing.id },
                    include: [{ model: User, as: 'User', attributes: ['id', 'full_name', 'email', 'role'] }]
                });
                
                return res.json({
                    success: true,
                    message: 'Team member reactivated',
                    data: updated
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'User already assigned to this project'
            });
        }

        const assignment = await ProjectTeamMember.create({
            project_id: projectId,
            user_id,
            role: role || 'technician',
            assigned_date: new Date(),
            start_date,
            end_date,
            notes
        });

        // Fetch with user data
        const created = await ProjectTeamMember.findOne({
            where: { id: assignment.id },
            include: [{ model: User, as: 'User', attributes: ['id', 'full_name', 'email', 'role'] }]
        });

        res.json({
            success: true,
            message: 'Team member added successfully',
            data: created
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add team member',
            error: error.message
        });
    }
});

// ==========================================
// REMOVE TEAM MEMBER FROM PROJECT (SOFT DELETE)
// ==========================================
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
  } catch (error) {
    console.error('Error removing team member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove team member'
    });
  }
});


// ==========================================
// GET BRAXON EMPLOYEES (for dropdown)
// ==========================================
// ==========================================
// GET BRAXON EMPLOYEES (for dropdown)
// ==========================================
router.get('/users/braxon-employees', async (req, res) => {
    try {
        const employees = await User.findAll({
            where: {
                company: 'Braxon Industries',
                role: {
                    [Op.in]: ['admin', 'pm', 'foreman', 'field', 'qa']  // ✅ Added 'foreman'
                },
                is_active: true
            },
            attributes: ['id', 'username', 'email', 'full_name', 'first_name', 'last_name', 'role'],
            order: [['full_name', 'ASC']]
        });

        // ✅ Build full_name if missing
        const processedEmployees = employees.map(emp => {
            const employee = emp.toJSON();
            
            // If full_name is empty, construct it
            if (!employee.full_name || employee.full_name.trim() === '') {
                if (employee.first_name && employee.last_name) {
                    employee.full_name = `${employee.first_name} ${employee.last_name}`;
                } else if (employee.username) {
                    employee.full_name = employee.username;
                } else {
                    employee.full_name = employee.email.split('@')[0];
                }
            }
            
            return employee;
        });

        console.log(`✅ Returning ${processedEmployees.length} Braxon employees`);

        res.json({
            success: true,
            count: processedEmployees.length,
            data: processedEmployees
        });
    } catch (error) {
        console.error('❌ Error fetching Braxon employees:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch Braxon employees',
            error: error.message
        });
    }
});

module.exports = router;
