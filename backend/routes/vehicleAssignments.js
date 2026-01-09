// backend/routes/vehicleAssignments.js
const express = require('express');
const router = express.Router();
const { VehicleAssignment, VehicleWalkaroundInspection, VehicleRegularInspection, VehicleInspectionDamageItem, Vehicle, User } = require('../models');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Authorization helper function
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// ==========================================
// MULTER CONFIGURATION FOR PHOTO UPLOADS
// ==========================================

// Ensure upload directories exist
const uploadDir = 'uploads/vehicles/walkarounds';
const inspectionUploadDir = 'uploads/vehicles/inspections';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(inspectionUploadDir)) {
  fs.mkdirSync(inspectionUploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const assignmentId = req.body.assignment_id || 'temp';
    const dir = path.join(uploadDir, assignmentId.toString());
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ==========================================
// VEHICLE ASSIGNMENT ROUTES
// ==========================================

// GET all assignments (Admin/PM only)
router.get('/', authenticateToken, authorizeRoles('admin', 'pm'), async (req, res) => {
  try {
    const assignments = await VehicleAssignment.findAll({
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'year', 'license_plate', 'vin']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: VehicleWalkaroundInspection,
          as: 'inspections',
          include: [
            {
              model: VehicleInspectionDamageItem,
              as: 'damageItems'
            }
          ]
        }
      ],
      order: [['assigned_date', 'DESC']]
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching vehicle assignments:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle assignments' });
  }
});

// GET single assignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await VehicleAssignment.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: VehicleWalkaroundInspection,
          as: 'inspections',
          include: [
            {
              model: VehicleInspectionDamageItem,
              as: 'damageItems'
            }
          ]
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'pm' && assignment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// GET assignments for a specific user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'pm' && req.user.id !== parseInt(req.params.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignments = await VehicleAssignment.findAll({
      where: { user_id: req.params.userId },
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: VehicleWalkaroundInspection,
          as: 'inspections'
        }
      ],
      order: [['assigned_date', 'DESC']]
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch user assignments' });
  }
});

// GET active assignment for a specific vehicle
router.get('/vehicle/:vehicleId/active', authenticateToken, async (req, res) => {
  try {
    const assignment = await VehicleAssignment.findOne({
      where: { 
        vehicle_id: req.params.vehicleId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: VehicleWalkaroundInspection,
          as: 'inspections'
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'No active assignment found for this vehicle' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching active assignment:', error);
    res.status(500).json({ error: 'Failed to fetch active assignment' });
  }
});

// POST - Create new vehicle assignment with checkout inspection
router.post('/', authenticateToken, authorizeRoles('admin', 'pm'), upload.fields([
  { name: 'front_photo', maxCount: 1 },
  { name: 'rear_photo', maxCount: 1 },
  { name: 'left_photo', maxCount: 1 },
  { name: 'right_photo', maxCount: 1 },
  { name: 'top_photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      vehicle_id,
      user_id,
      starting_mileage,
      mileage,
      damage_notes,
      has_damage,
      inspector_signature,
      inspector_name
    } = req.body;

    // Validate required fields
    if (!vehicle_id || !user_id || !starting_mileage || !mileage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if vehicle already has an active assignment
    const existingAssignment = await VehicleAssignment.findOne({
      where: { vehicle_id, status: 'active' }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Vehicle is already assigned to another user' });
    }

    // Create the assignment
    const assignment = await VehicleAssignment.create({
      vehicle_id,
      user_id,
      starting_mileage,
      assigned_by: req.user.id,
      status: 'active'
    });

    // Create checkout inspection with photos
    const photosPaths = {};
    if (req.files) {
      if (req.files.front_photo) photosPaths.front_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.front_photo[0].filename}`;
      if (req.files.rear_photo) photosPaths.rear_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.rear_photo[0].filename}`;
      if (req.files.left_photo) photosPaths.left_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.left_photo[0].filename}`;
      if (req.files.right_photo) photosPaths.right_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.right_photo[0].filename}`;
      if (req.files.top_photo) photosPaths.top_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.top_photo[0].filename}`;
    }

    const inspection = await VehicleWalkaroundInspection.create({
      assignment_id: assignment.id,
      inspection_type: 'checkout',
      mileage,
      ...photosPaths,
      damage_notes,
      has_damage: has_damage === 'true' || has_damage === true,
      inspector_signature,
      inspector_id: req.user.id,
      inspector_name: inspector_name || req.user.full_name
    });

    // Update vehicle status and assigned user
    await Vehicle.update(
      { 
        assigned_user_id: user_id,
        assigned_date: new Date(),
        current_mileage: starting_mileage
      },
      { where: { id: vehicle_id } }
    );

    // Fetch complete assignment with relations
    const completeAssignment = await VehicleAssignment.findByPk(assignment.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'assignedUser', attributes: ['id', 'username', 'full_name'] },
        { model: User, as: 'assignedByUser', attributes: ['id', 'username', 'full_name'] },
        { model: VehicleWalkaroundInspection, as: 'inspections' }
      ]
    });

    res.status(201).json(completeAssignment);
  } catch (error) {
    console.error('Error creating vehicle assignment:', error);
    res.status(500).json({ error: 'Failed to create vehicle assignment', details: error.message });
  }
});

// PUT - Return vehicle (create checkin inspection)
router.put('/:id/return', authenticateToken, upload.fields([
  { name: 'front_photo', maxCount: 1 },
  { name: 'rear_photo', maxCount: 1 },
  { name: 'left_photo', maxCount: 1 },
  { name: 'right_photo', maxCount: 1 },
  { name: 'top_photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      ending_mileage,
      mileage,
      damage_notes,
      has_damage,
      return_notes,
      inspector_signature,
      inspector_name
    } = req.body;

    const assignment = await VehicleAssignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.status === 'returned') {
      return res.status(400).json({ error: 'Vehicle has already been returned' });
    }

    // Validate mileage
    if (ending_mileage < assignment.starting_mileage) {
      return res.status(400).json({ error: 'Ending mileage cannot be less than starting mileage' });
    }

    // Create checkin inspection with photos
    const photosPaths = {};
    if (req.files) {
      if (req.files.front_photo) photosPaths.front_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.front_photo[0].filename}`;
      if (req.files.rear_photo) photosPaths.rear_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.rear_photo[0].filename}`;
      if (req.files.left_photo) photosPaths.left_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.left_photo[0].filename}`;
      if (req.files.right_photo) photosPaths.right_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.right_photo[0].filename}`;
      if (req.files.top_photo) photosPaths.top_photo = `/uploads/vehicles/walkarounds/${assignment.id}/${req.files.top_photo[0].filename}`;
    }

    await VehicleWalkaroundInspection.create({
      assignment_id: assignment.id,
      inspection_type: 'checkin',
      mileage: mileage || ending_mileage,
      ...photosPaths,
      damage_notes,
      has_damage: has_damage === 'true' || has_damage === true,
      inspector_signature,
      inspector_id: req.user.id,
      inspector_name: inspector_name || req.user.full_name
    });

    // Update assignment
    await assignment.update({
      status: 'returned',
      returned_date: new Date(),
      ending_mileage,
      return_notes
    });

    // Update vehicle
    await Vehicle.update(
      { 
        assigned_user_id: null,
        assigned_date: null,
        current_mileage: ending_mileage
      },
      { where: { id: assignment.vehicle_id } }
    );

    // Fetch complete assignment
    const completeAssignment = await VehicleAssignment.findByPk(assignment.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'assignedUser', attributes: ['id', 'username', 'full_name'] },
        { model: VehicleWalkaroundInspection, as: 'inspections' }
      ]
    });

    res.json(completeAssignment);
  } catch (error) {
    console.error('Error returning vehicle:', error);
    res.status(500).json({ error: 'Failed to return vehicle', details: error.message });
  }
});

// ==========================================
// REGULAR INSPECTION ROUTES
// ==========================================

// GET all regular inspections for a vehicle
router.get('/vehicle/:vehicleId/inspections', authenticateToken, async (req, res) => {
  try {
    const inspections = await VehicleRegularInspection.findAll({
      where: { vehicle_id: req.params.vehicleId },
      include: [
        {
          model: User,
          as: 'inspector',
          attributes: ['id', 'username', 'full_name']
        }
      ],
      order: [['inspection_date', 'DESC']]
    });

    res.json(inspections);
  } catch (error) {
    console.error('Error fetching regular inspections:', error);
    res.status(500).json({ error: 'Failed to fetch regular inspections' });
  }
});

// POST - Create regular inspection
router.post('/inspections/regular', authenticateToken, upload.fields([
  { name: 'front_photo', maxCount: 1 },
  { name: 'rear_photo', maxCount: 1 },
  { name: 'left_photo', maxCount: 1 },
  { name: 'right_photo', maxCount: 1 },
  { name: 'top_photo', maxCount: 1 },
  { name: 'interior_photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const inspectionData = { ...req.body };

    // Handle photo uploads
    if (req.files) {
      const vehicleId = req.body.vehicle_id;
      const timestamp = Date.now();
      
      if (req.files.front_photo) inspectionData.front_photo = `/uploads/vehicles/inspections/${vehicleId}/${timestamp}-front.jpg`;
      if (req.files.rear_photo) inspectionData.rear_photo = `/uploads/vehicles/inspections/${vehicleId}/${timestamp}-rear.jpg`;
      if (req.files.left_photo) inspectionData.left_photo = `/uploads/vehicles/inspections/${vehicleId}/${timestamp}-left.jpg`;
      if (req.files.right_photo) inspectionData.right_photo = `/uploads/vehicles/inspections/${vehicleId}/${timestamp}-right.jpg`;
      if (req.files.top_photo) inspectionData.top_photo = `/uploads/vehicles/inspections/${vehicleId}/${timestamp}-top.jpg`;
      if (req.files.interior_photo) inspectionData.interior_photo = `/uploads/vehicles/inspections/${vehicleId}/${timestamp}-interior.jpg`;
    }

    // Set inspector info
    inspectionData.inspector_id = req.user.id;
    inspectionData.inspector_name = inspectionData.inspector_name || req.user.full_name;

    // Convert string booleans to actual booleans
    ['has_damage', 'requires_maintenance', 'follow_up_required'].forEach(field => {
      if (inspectionData[field]) {
        inspectionData[field] = inspectionData[field] === 'true' || inspectionData[field] === true;
      }
    });

    const inspection = await VehicleRegularInspection.create(inspectionData);

    // Update vehicle's last inspection date and mileage
    await Vehicle.update(
      { 
        last_inspection_date: inspection.inspection_date,
        current_mileage: inspection.mileage
      },
      { where: { id: inspection.vehicle_id } }
    );

    const completeInspection = await VehicleRegularInspection.findByPk(inspection.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'inspector', attributes: ['id', 'username', 'full_name'] }
      ]
    });

    res.status(201).json(completeInspection);
  } catch (error) {
    console.error('Error creating regular inspection:', error);
    res.status(500).json({ error: 'Failed to create regular inspection', details: error.message });
  }
});

// GET upcoming inspections (vehicles due for inspection)
router.get('/inspections/upcoming', authenticateToken, authorizeRoles('admin', 'pm'), async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingInspections = await VehicleRegularInspection.findAll({
      where: {
        next_inspection_due: {
          [Op.between]: [today, thirtyDaysFromNow]
        }
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate']
        }
      ],
      order: [['next_inspection_due', 'ASC']]
    });

    res.json(upcomingInspections);
  } catch (error) {
    console.error('Error fetching upcoming inspections:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming inspections' });
  }
});

module.exports = router;