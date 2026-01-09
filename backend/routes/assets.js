const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');
const { QueryTypes } = require('sequelize');

// ==================== ASSET CATEGORIES ====================

// GET /api/assets/categories
router.get('/categories', protect, async (req, res) => {
    try {
        const categories = await db.sequelize.query(
            `SELECT * FROM asset_categories 
             WHERE is_active = true 
             ORDER BY category_type, category_name`,
            { type: QueryTypes.SELECT }
        );

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching asset categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
});

// POST /api/assets/categories (Admin only)
router.post('/categories', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { category_name, category_type, icon_emoji } = req.body;

        await db.sequelize.query(
            `INSERT INTO asset_categories (category_name, category_type, icon_emoji)
             VALUES (:category_name, :category_type, :icon_emoji)`,
            {
                replacements: { category_name, category_type, icon_emoji: icon_emoji || '📦' }
            }
        );

        res.json({
            success: true,
            message: 'Category created successfully'
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
});

// ==================== ASSETS ====================

// GET /api/assets (All assets with filters)
router.get('/', protect, async (req, res) => {
    try {
        const { category, status, assigned } = req.query;

        let whereClause = '';
        const replacements = {};

        if (category) {
            whereClause += ' AND ac.category_type = :category';
            replacements.category = category;
        }

        if (status) {
            whereClause += ' AND ca.operational_status = :status';
            replacements.status = status;
        }

        if (assigned === 'true') {
            whereClause += ' AND ca.assigned_to_user_id IS NOT NULL';
        } else if (assigned === 'false') {
            whereClause += ' AND ca.assigned_to_user_id IS NULL';
        }

        const assets = await db.sequelize.query(
            `SELECT 
                ca.*,
                ac.category_name,
                ac.category_type,
                ac.icon_emoji,
                u.full_name as assigned_to_name,
                u.email as assigned_to_email,
                creator.full_name as created_by_name
             FROM company_assets ca
             JOIN asset_categories ac ON ca.category_id = ac.id
             LEFT JOIN users u ON ca.assigned_to_user_id = u.id
             LEFT JOIN users creator ON ca.created_by = creator.id
             WHERE 1=1 ${whereClause}
             ORDER BY ca.created_at DESC`,
            {
                replacements,
                type: QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            data: assets
        });
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assets',
            error: error.message
        });
    }
});

// GET /api/assets/:id (Single asset with full details)
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        const asset = await db.sequelize.query(
            `SELECT 
                ca.*,
                ac.category_name,
                ac.category_type,
                u.full_name as assigned_to_name
             FROM company_assets ca
             JOIN asset_categories ac ON ca.category_id = ac.id
             LEFT JOIN users u ON ca.assigned_to_user_id = u.id
             WHERE ca.id = :id`,
            {
                replacements: { id },
                type: QueryTypes.SELECT
            }
        );

        if (!asset || asset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        // Get documents
        const documents = await db.sequelize.query(
            `SELECT * FROM asset_documents WHERE asset_id = :id ORDER BY uploaded_at DESC`,
            {
                replacements: { id },
                type: QueryTypes.SELECT
            }
        );

        // Get maintenance history
        const maintenance = await db.sequelize.query(
            `SELECT * FROM asset_maintenance WHERE asset_id = :id ORDER BY maintenance_date DESC`,
            {
                replacements: { id },
                type: QueryTypes.SELECT
            }
        );

        // Get assignment history
        const assignments = await db.sequelize.query(
            `SELECT 
                ah.*,
                u.full_name as user_name,
                admin.full_name as assigned_by_name
             FROM asset_assignment_history ah
             LEFT JOIN users u ON ah.user_id = u.id
             LEFT JOIN users admin ON ah.assigned_by = admin.id
             WHERE ah.asset_id = :id
             ORDER BY ah.assigned_date DESC`,
            {
                replacements: { id },
                type: QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            data: {
                asset: asset[0],
                documents,
                maintenance,
                assignments
            }
        });
    } catch (error) {
        console.error('Error fetching asset details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch asset details',
            error: error.message
        });
    }
});

// POST /api/assets (Create new asset)
router.post('/', protect, async (req, res) => {
    try {
        if (!['admin', 'pm'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin or PM access required'
            });
        }

        const {
            category_id,
            asset_name,
            manufacturer,
            model,
            serial_number,
            vin,
            purchase_date,
            purchase_cost,
            current_value,
            condition_status,
            current_location,
            notes,
            custom_fields
        } = req.body;

        // Get category type for asset_id generation
        const category = await db.sequelize.query(
            `SELECT category_type FROM asset_categories WHERE id = :category_id`,
            {
                replacements: { category_id },
                type: QueryTypes.SELECT
            }
        );

        if (!category || category.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Generate asset_id
        const assetId = await db.sequelize.query(
            `SELECT generate_asset_id(:category_type) as asset_id`,
            {
                replacements: { category_type: category[0].category_type },
                type: QueryTypes.SELECT
            }
        );

        // Insert asset
        const result = await db.sequelize.query(
            `INSERT INTO company_assets (
                asset_id, category_id, asset_name, manufacturer, model, 
                serial_number, vin, purchase_date, purchase_cost, current_value,
                condition_status, current_location, notes, custom_fields, created_by
             ) VALUES (
                :asset_id, :category_id, :asset_name, :manufacturer, :model,
                :serial_number, :vin, :purchase_date, :purchase_cost, :current_value,
                :condition_status, :current_location, :notes, :custom_fields, :created_by
             ) RETURNING id`,
            {
                replacements: {
                    asset_id: assetId[0].asset_id,
                    category_id,
                    asset_name,
                    manufacturer: manufacturer || null,
                    model: model || null,
                    serial_number: serial_number || 'N/A',
                    vin: vin || null,
                    purchase_date: purchase_date || null,
                    purchase_cost: purchase_cost || null,
                    current_value: current_value || purchase_cost || null,
                    condition_status: condition_status || 'excellent',
                    current_location: current_location || 'Shop',
                    notes: notes || null,
                    custom_fields: custom_fields ? JSON.stringify(custom_fields) : null,
                    created_by: req.user.id
                },
                type: QueryTypes.INSERT
            }
        );

        res.json({
            success: true,
            message: 'Asset created successfully',
            data: { id: result[0][0].id, asset_id: assetId[0].asset_id }
        });
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create asset',
            error: error.message
        });
    }
});

// PUT /api/assets/:id (Update asset)
router.put('/:id', protect, async (req, res) => {
    try {
        if (!['admin', 'pm'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin or PM access required'
            });
        }

        const { id } = req.params;
        const {
            asset_name,
            manufacturer,
            model,
            serial_number,
            vin,
            purchase_cost,
            current_value,
            condition_status,
            operational_status,
            current_location,
            notes
        } = req.body;

        await db.sequelize.query(
            `UPDATE company_assets SET
                asset_name = :asset_name,
                manufacturer = :manufacturer,
                model = :model,
                serial_number = :serial_number,
                vin = :vin,
                purchase_cost = :purchase_cost,
                current_value = :current_value,
                condition_status = :condition_status,
                operational_status = :operational_status,
                current_location = :current_location,
                notes = :notes,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id`,
            {
                replacements: {
                    id,
                    asset_name,
                    manufacturer,
                    model,
                    serial_number,
                    vin,
                    purchase_cost,
                    current_value,
                    condition_status,
                    operational_status,
                    current_location,
                    notes
                }
            }
        );

        res.json({
            success: true,
            message: 'Asset updated successfully'
        });
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update asset',
            error: error.message
        });
    }
});

// DELETE /api/assets/:id (Admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { id } = req.params;

        await db.sequelize.query(
            `DELETE FROM company_assets WHERE id = :id`,
            { replacements: { id } }
        );

        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete asset',
            error: error.message
        });
    }
});

// ==================== ASSIGNMENT ====================

// POST /api/assets/:id/assign (Assign asset to user)
router.post('/:id/assign', protect, async (req, res) => {
    try {
        if (!['admin', 'pm'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin or PM access required'
            });
        }

        const { id } = req.params;
        const { user_id, assigned_date, starting_condition, starting_mileage, assignment_notes } = req.body;

        // Update asset
        await db.sequelize.query(
            `UPDATE company_assets SET
                assigned_to_user_id = :user_id,
                assigned_date = :assigned_date,
                assignment_notes = :assignment_notes,
                operational_status = 'assigned',
                current_location = 'With User',
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id`,
            {
                replacements: { id, user_id, assigned_date, assignment_notes }
            }
        );

        // Log in assignment history
        await db.sequelize.query(
            `INSERT INTO asset_assignment_history 
             (asset_id, user_id, assigned_by, assigned_date, starting_condition, starting_mileage, assignment_notes)
             VALUES (:asset_id, :user_id, :assigned_by, :assigned_date, :starting_condition, :starting_mileage, :assignment_notes)`,
            {
                replacements: {
                    asset_id: id,
                    user_id,
                    assigned_by: req.user.id,
                    assigned_date,
                    starting_condition,
                    starting_mileage,
                    assignment_notes
                }
            }
        );

        res.json({
            success: true,
            message: 'Asset assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign asset',
            error: error.message
        });
    }
});

// POST /api/assets/:id/unassign (Return asset)
router.post('/:id/unassign', protect, async (req, res) => {
    try {
        if (!['admin', 'pm'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin or PM access required'
            });
        }

        const { id } = req.params;
        const { returned_date, ending_condition, ending_mileage, damage_notes } = req.body;

        // Update assignment history
        await db.sequelize.query(
            `UPDATE asset_assignment_history SET
                returned_date = :returned_date,
                ending_condition = :ending_condition,
                ending_mileage = :ending_mileage,
                damage_notes = :damage_notes
             WHERE asset_id = :asset_id 
               AND returned_date IS NULL
             ORDER BY assigned_date DESC
             LIMIT 1`,
            {
                replacements: {
                    asset_id: id,
                    returned_date,
                    ending_condition,
                    ending_mileage,
                    damage_notes
                }
            }
        );

        // Update asset
        await db.sequelize.query(
            `UPDATE company_assets SET
                assigned_to_user_id = NULL,
                assigned_date = NULL,
                assignment_notes = NULL,
                operational_status = 'available',
                current_location = 'Shop',
                condition_status = :ending_condition,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id`,
            {
                replacements: { id, ending_condition }
            }
        );

        res.json({
            success: true,
            message: 'Asset returned successfully'
        });
    } catch (error) {
        console.error('Error unassigning asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unassign asset',
            error: error.message
        });
    }
});

module.exports = router;