const express = require('express');
const router = express.Router();
const db = require('../models');
const { UserCertification } = db;  // ← Make sure this matches
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get certifications for a user
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

        const certifications = await UserCertification.findAll({
            where: { user_id: userId },
            order: [
                ['expiration_date', 'ASC NULLS LAST'],
                ['issue_date', 'DESC']
            ]
        });

        // Update status based on expiration dates
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        for (const cert of certifications) {
            if (cert.expiration_date) {
                const expDate = new Date(cert.expiration_date);
                
                if (expDate < today) {
                    cert.status = 'expired';
                } else if (expDate <= thirtyDaysFromNow) {
                    cert.status = 'expiring_soon';
                } else {
                    cert.status = 'active';
                }

                await cert.save();
            }
        }

        res.json({
            success: true,
            count: certifications.length,
            data: certifications
        });

    } catch (error) {
        console.error('Error fetching certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certifications'
        });
    }
});

// Get single certification by ID
router.get('/detail/:certId', protect, async (req, res) => {
    try {
        const { certId } = req.params;

        const cert = await UserCertification.findByPk(certId);

        if (!cert) {
            return res.status(404).json({
                success: false,
                message: 'Certification not found'
            });
        }

        // Check access
        if (req.user.id !== cert.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: cert
        });

    } catch (error) {
        console.error('Error fetching certification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certification'
        });
    }
});

// Create certification (Admin only)
router.post('/:userId', protect, async (req, res) => {
    try {
        // Only admins can create certifications
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can add certifications'
            });
        }

        const { userId } = req.params;
        const {
            cert_type,
            cert_number,
            cert_name,
            issue_date,
            expiration_date,
            file_path,
            notes
        } = req.body;

        // Validate required fields
        if (!cert_type || !cert_name) {
            return res.status(400).json({
                success: false,
                message: 'Certification type and name are required'
            });
        }

        // Determine initial status
        let status = 'active';
        if (expiration_date) {
            const expDate = new Date(expiration_date);
            const today = new Date();
            const thirtyDays = new Date();
            thirtyDays.setDate(today.getDate() + 30);

            if (expDate < today) {
                status = 'expired';
            } else if (expDate <= thirtyDays) {
                status = 'expiring_soon';
            }
        }

        const cert = await UserCertification.create({
            user_id: userId,
            cert_type,
            cert_number: cert_number || 'N/A',
            cert_name,
            issue_date,
            expiration_date,
            file_path,
            uploaded_by: req.user.id,
            notes,
            status
        });

        res.json({
            success: true,
            message: 'Certification added successfully',
            data: cert
        });

    } catch (error) {
        console.error('Error creating certification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create certification',
            error: error.message
        });
    }
});

// Update certification (Admin only)
router.put('/:certId', protect, async (req, res) => {
    try {
        // Only admins can update certifications
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update certifications'
            });
        }

        const { certId } = req.params;
        const {
            cert_number,
            cert_name,
            issue_date,
            expiration_date,
            file_path,
            notes
        } = req.body;

        const cert = await UserCertification.findByPk(certId);

        if (!cert) {
            return res.status(404).json({
                success: false,
                message: 'Certification not found'
            });
        }

        // Update fields
        if (cert_number !== undefined) cert.cert_number = cert_number;
        if (cert_name !== undefined) cert.cert_name = cert_name;
        if (issue_date !== undefined) cert.issue_date = issue_date;
        if (expiration_date !== undefined) cert.expiration_date = expiration_date;
        if (file_path !== undefined) cert.file_path = file_path;
        if (notes !== undefined) cert.notes = notes;

        // Update status
        if (expiration_date) {
            const expDate = new Date(expiration_date);
            const today = new Date();
            const thirtyDays = new Date();
            thirtyDays.setDate(today.getDate() + 30);

            if (expDate < today) {
                cert.status = 'expired';
            } else if (expDate <= thirtyDays) {
                cert.status = 'expiring_soon';
            } else {
                cert.status = 'active';
            }
        }

        await cert.save();

        res.json({
            success: true,
            message: 'Certification updated successfully',
            data: cert
        });

    } catch (error) {
        console.error('Error updating certification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update certification'
        });
    }
});

// Delete certification (Admin only)
router.delete('/:certId', protect, async (req, res) => {
    try {
        // Only admins can delete certifications
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete certifications'
            });
        }

        const { certId } = req.params;

        const cert = await UserCertification.findByPk(certId);

        if (!cert) {
            return res.status(404).json({
                success: false,
                message: 'Certification not found'
            });
        }

        await cert.destroy();

        res.json({
            success: true,
            message: 'Certification deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting certification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete certification'
        });
    }
});

module.exports = router;