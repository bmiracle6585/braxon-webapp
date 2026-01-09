const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');
const { QueryTypes } = require('sequelize');

const Vehicle = db.Vehicle;
const User = db.User;

// ==========================================
// GET /api/vehicles
// Get all vehicles with assigned user info
// Access: Admin, PM
// ==========================================
router.get('/', protect, async (req, res) => {
    try {
        // Only admins and PMs can view all vehicles
        if (!['admin', 'pm'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const vehicles = await Vehicle.findAll({
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'assignedUser',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    required: false
                }
            ]
        });

        res.json({
            success: true,
            data: vehicles
        });

    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/vehicles/all
// Get all company vehicles for dropdowns
// Access: All authenticated users
// ==========================================
router.get('/all', protect, async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll({
            where: { status: 'active' },
            attributes: ['id', 'make', 'model', 'year', 'vin', 'license_plate'],
            order: [['year', 'DESC'], ['make', 'ASC'], ['model', 'ASC']]
        });

        res.json({
            success: true,
            data: vehicles
        });

    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/vehicles/:id
// Get single vehicle details
// Access: All authenticated users
// ==========================================
router.get('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'assignedUser',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
                    required: false
                }
            ]
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            data: vehicle
        });

    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle',
            error: error.message
        });
    }
});

// ==========================================
// POST /api/vehicles
// Create new vehicle
// Access: Admin only
// ==========================================
router.post('/', protect, async (req, res) => {
    try {
        // Only admins can create vehicles
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can add vehicles'
            });
        }

        const {
            make,
            model,
            year,
            license_plate,
            vin,
            color,
            current_mileage,
            status,
            assigned_user_id,
            registration_expiration,
            insurance_expiration,
            notes
        } = req.body;

        // Validate required fields
        if (!make || !model || !year || !license_plate || !vin) {
            return res.status(400).json({
                success: false,
                message: 'Make, model, year, license plate, and VIN are required'
            });
        }

        // Check for duplicate license plate
        const existingPlate = await Vehicle.findOne({ 
            where: { license_plate: license_plate.toUpperCase() } 
        });
        if (existingPlate) {
            return res.status(400).json({
                success: false,
                message: 'A vehicle with this license plate already exists'
            });
        }

        // Check for duplicate VIN
        const existingVin = await Vehicle.findOne({ 
            where: { vin: vin.toUpperCase() } 
        });
        if (existingVin) {
            return res.status(400).json({
                success: false,
                message: 'A vehicle with this VIN already exists'
            });
        }

        // Create vehicle
        const vehicle = await Vehicle.create({
            make,
            model,
            year: parseInt(year),
            license_plate: license_plate.toUpperCase(),
            vin: vin.toUpperCase(),
            color: color || null,
            current_mileage: current_mileage ? parseInt(current_mileage) : null,
            status: status || 'active',
            assigned_user_id: assigned_user_id || null,
            assigned_date: assigned_user_id ? new Date() : null,
            registration_expiration: registration_expiration || null,
            insurance_expiration: insurance_expiration || null,
            notes: notes || null
        });

        res.status(201).json({
            success: true,
            message: 'Vehicle created successfully',
            data: vehicle
        });

    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create vehicle',
            error: error.message
        });
    }
});

// ==========================================
// PUT /api/vehicles/:id
// Update vehicle
// Access: Admin only
// ==========================================
router.put('/:id', protect, async (req, res) => {
    try {
        const { Sequelize } = require('sequelize');
        const Op = Sequelize.Op;

        // Only admins can update vehicles
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update vehicles'
            });
        }

        const vehicle = await Vehicle.findByPk(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        const {
            make,
            model,
            year,
            license_plate,
            vin,
            color,
            current_mileage,
            status,
            assigned_user_id,
            registration_expiration,
            insurance_expiration,
            notes
        } = req.body;

        // Check for duplicate license plate (excluding current vehicle)
        if (license_plate && license_plate.toUpperCase() !== vehicle.license_plate) {
            const existingPlate = await Vehicle.findOne({
                where: {
                    license_plate: license_plate.toUpperCase(),
                    id: { [Op.ne]: req.params.id }
                }
            });
            if (existingPlate) {
                return res.status(400).json({
                    success: false,
                    message: 'A vehicle with this license plate already exists'
                });
            }
        }

        // Check for duplicate VIN (excluding current vehicle)
        if (vin && vin.toUpperCase() !== vehicle.vin) {
            const existingVin = await Vehicle.findOne({
                where: {
                    vin: vin.toUpperCase(),
                    id: { [Op.ne]: req.params.id }
                }
            });
            if (existingVin) {
                return res.status(400).json({
                    success: false,
                    message: 'A vehicle with this VIN already exists'
                });
            }
        }

        // Track if assignment changed
        const assignmentChanged = assigned_user_id && assigned_user_id !== vehicle.assigned_user_id;

        // Update vehicle
        await vehicle.update({
            make: make || vehicle.make,
            model: model || vehicle.model,
            year: year ? parseInt(year) : vehicle.year,
            license_plate: license_plate ? license_plate.toUpperCase() : vehicle.license_plate,
            vin: vin ? vin.toUpperCase() : vehicle.vin,
            color: color !== undefined ? color : vehicle.color,
            current_mileage: current_mileage !== undefined ? parseInt(current_mileage) : vehicle.current_mileage,
            status: status || vehicle.status,
            assigned_user_id: assigned_user_id !== undefined ? assigned_user_id : vehicle.assigned_user_id,
            assigned_date: assignmentChanged ? new Date() : vehicle.assigned_date,
            registration_expiration: registration_expiration !== undefined ? registration_expiration : vehicle.registration_expiration,
            insurance_expiration: insurance_expiration !== undefined ? insurance_expiration : vehicle.insurance_expiration,
            notes: notes !== undefined ? notes : vehicle.notes
        });

        res.json({
            success: true,
            message: 'Vehicle updated successfully',
            data: vehicle
        });

    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle',
            error: error.message
        });
    }
});

// ==========================================
// DELETE /api/vehicles/:id
// Delete vehicle
// Access: Admin only
// ==========================================
router.delete('/:id', protect, async (req, res) => {
    try {
        // Only admins can delete vehicles
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete vehicles'
            });
        }

        const vehicle = await Vehicle.findByPk(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        await vehicle.destroy();

        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        });

    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vehicle',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/vehicles/user/:userId
// Get vehicles assigned to a user
// Access: All authenticated users
// ==========================================
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll({
            where: {
                assigned_user_id: req.params.userId,
                status: 'active'
            },
            order: [['assigned_date', 'DESC']]
        });

        res.json({
            success: true,
            data: vehicles
        });

    } catch (error) {
        console.error('Get user vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user vehicles',
            error: error.message
        });
    }
});

module.exports = router;