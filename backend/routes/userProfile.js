const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');
const { User, UserEmergencyContact, UserCertification, UserEquipment } = db;
const { QueryTypes } = require('sequelize');
console.log('🔵 userProfile.js routes loaded');

//router.get('/:userId/full-profile', protect, async (req, res) => {
    //console.log('🔵 Full profile route HIT for userId:', req.params.userId);

// GET /:userId/full-profile
// Access: Admin, PM, or self
router.get('/:userId/full-profile', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check access (admin/pm only, or self)
        if (req.user.id !== parseInt(userId) && 
            !['admin', 'pm'].includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only view your own profile.' 
            });
        }
        
        // Get user basic info (exclude password)
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get emergency contacts
        const emergencyContacts = await UserEmergencyContact.findAll({
            where: { user_id: userId },
            order: [['contact_type', 'ASC']]
        });
        
        // Get certifications
        const certifications = await UserCertification.findAll({
            where: { user_id: userId },
            order: [['expiration_date', 'ASC']]
        });
        
        // Get equipment
        const equipment = await UserEquipment.findAll({
            where: { user_id: userId, is_active: true },
            order: [['assigned_date', 'DESC']]
        });
        
        // Get section statuses (N/A tracking)
        const sectionStatuses = await db.sequelize.query(
            `SELECT section, status, na_reason, updated_at 
             FROM user_profile_sections 
             WHERE user_id = :userId`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );
        
        // Build response
        res.json({
            success: true,
            data: {
                user,
                emergencyContacts,
                certifications,
                equipment,
                sectionStatuses: sectionStatuses.reduce((acc, item) => {
                    acc[item.section] = {
                        status: item.status,
                        na_reason: item.na_reason,
                        updated_at: item.updated_at
                    };
                    return acc;
                }, {})
            }
        });
        
    } catch (error) {
        console.error('Error fetching full profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// PUT /:userId/section-status
// Access: Admin only
router.put('/:userId/section-status', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const { section, status, na_reason } = req.body;
        
        // Only admins can mark sections as N/A
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can modify section status'
            });
        }

        // Validate section name
        const validSections = ['basic_info', 'emergency_contacts', 'certifications', 'equipment', 'vehicle'];
        if (!validSections.includes(section)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        // Validate status
        const validStatuses = ['active', 'na', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: active, na, or pending'
            });
        }
        
        // Upsert section status
        await db.sequelize.query(
            `INSERT INTO user_profile_sections (user_id, section, status, na_reason, updated_by, updated_at)
             VALUES (:userId, :section, :status, :na_reason, :updatedBy, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, section) 
             DO UPDATE SET 
                status = :status, 
                na_reason = :na_reason,
                updated_by = :updatedBy,
                updated_at = CURRENT_TIMESTAMP`,
            {
                replacements: {
                    userId,
                    section,
                    status,
                    na_reason: na_reason || null,
                    updatedBy: req.user.id
                }
            }
        );
        
        res.json({
            success: true,
            message: 'Section status updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating section status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update section status',
            error: error.message
        });
    }
});

// PUT /:userId/basic-info
// Access: Admin only
router.put('/:userId/basic-info', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const { phone, company } = req.body;
        
        // Only admins can edit other users
        if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields
        if (phone !== undefined) user.phone = phone;
        if (company !== undefined) user.company = company;

        await user.save();

        res.json({
            success: true,
            message: 'Basic information updated successfully',
            data: { phone: user.phone, company: user.company }
        });

    } catch (error) {
        console.error('Error updating basic info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update basic information',
            error: error.message
        });
    }
});

module.exports = router;