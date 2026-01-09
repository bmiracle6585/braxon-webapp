const express = require('express');
const router = express.Router();
const db = require('../models');
const { UserEquipment, User } = db;  // ← Make sure this matches
const { protect } = require('../middleware/auth');

// Get equipment for a user
router.get('/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check access
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const equipment = await UserEquipment.findAll({
            where: {
                user_id: userId,
                is_active: true
            },
            order: [['assigned_date', 'DESC']]
        });

        res.json({
            success: true,
            count: equipment.length,
            data: equipment
        });

    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment'
        });
    }
});

// Get single equipment by ID
router.get('/detail/:equipmentId', protect, async (req, res) => {
    try {
        const { equipmentId } = req.params;

        const equipment = await UserEquipment.findByPk(equipmentId, {
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'full_name', 'email']
                },
                {
                    model: User,
                    as: 'CreatedBy',
                    attributes: ['id', 'full_name', 'email']
                }
            ]
        });

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check access
        if (req.user.id !== equipment.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: equipment
        });

    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment'
        });
    }
});

// Assign equipment to user (Admin only)
router.post('/:userId', protect, async (req, res) => {
    try {
        // Only admins can assign equipment
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can assign equipment'
            });
        }

        const { userId } = req.params;
        const {
            equipment_type,
            manufacturer,
            model,
            serial_number,
            purchase_date,
            assigned_date,
            condition_status,
            notes
        } = req.body;

        // Validate required fields
        if (!equipment_type || !model) {
            return res.status(400).json({
                success: false,
                message: 'Equipment type and model are required'
            });
        }

        const equipment = await UserEquipment.create({
            user_id: userId,
            equipment_type,
            manufacturer: manufacturer || 'N/A',
            model,
            serial_number: serial_number || 'N/A',
            purchase_date,
            assigned_date: assigned_date || new Date(),
            condition_status: condition_status || 'good',
            notes,
            created_by: req.user.id,
            is_active: true
        });

        res.json({
            success: true,
            message: 'Equipment assigned successfully',
            data: equipment
        });

    } catch (error) {
        console.error('Error assigning equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign equipment',
            error: error.message
        });
    }
});

// Update equipment (Admin only)
router.put('/:equipmentId', protect, async (req, res) => {
    try {
        // Only admins can update equipment
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update equipment'
            });
        }

        const { equipmentId } = req.params;
        const {
            manufacturer,
            model,
            serial_number,
            condition_status,
            notes
        } = req.body;

        const equipment = await UserEquipment.findByPk(equipmentId);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Update fields
        if (manufacturer !== undefined) equipment.manufacturer = manufacturer;
        if (model !== undefined) equipment.model = model;
        if (serial_number !== undefined) equipment.serial_number = serial_number;
        if (condition_status !== undefined) equipment.condition_status = condition_status;
        if (notes !== undefined) equipment.notes = notes;

        await equipment.save();

        res.json({
            success: true,
            message: 'Equipment updated successfully',
            data: equipment
        });

    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment'
        });
    }
});

// Sign for equipment (User accepting equipment)
router.post('/:equipmentId/sign', protect, async (req, res) => {
    try {
        const { equipmentId } = req.params;
        const { signature_url } = req.body;

        const equipment = await UserEquipment.findByPk(equipmentId);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check if user is assigned to this equipment
        if (req.user.id !== equipment.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only sign for equipment assigned to you'
            });
        }

        // Create signature data
        const signatureData = {
            signed: true,
            signature_url: signature_url || '/uploads/signatures/default.png',
            signed_by: req.user.id,
            signed_by_name: req.user.full_name
        };

        equipment.signature_data = JSON.stringify(signatureData);
        equipment.signed_at = new Date();

        await equipment.save();

        res.json({
            success: true,
            message: 'Equipment signature recorded successfully',
            data: equipment
        });

    } catch (error) {
        console.error('Error signing equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record signature'
        });
    }
});

// Deactivate equipment (Admin only - soft delete)
router.delete('/:equipmentId', protect, async (req, res) => {
    try {
        // Only admins can deactivate equipment
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can remove equipment'
            });
        }

        const { equipmentId } = req.params;

        const equipment = await UserEquipment.findByPk(equipmentId);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Soft delete
        equipment.is_active = false;
        await equipment.save();

        res.json({
            success: true,
            message: 'Equipment removed successfully'
        });

    } catch (error) {
        console.error('Error removing equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove equipment'
        });
    }
});

module.exports = router;