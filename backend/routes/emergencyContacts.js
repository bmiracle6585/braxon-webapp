const express = require('express');
const router = express.Router();
const db = require('../models');
const { UserEmergencyContact } = db;  // ← Make sure this matches
const { protect } = require('../middleware/auth');

// Get emergency contacts for a user
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

        const contacts = await UserEmergencyContact.findAll({
            where: { user_id: userId },
            order: [['contact_type', 'ASC']]
        });

        res.json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency contacts'
        });
    }
});

// Create or update emergency contact
router.post('/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const { contact_type, name, relationship, phone, email } = req.body;

        // Check access
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Validate required fields
        if (!contact_type || !name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Contact type, name, and phone are required'
            });
        }

        // Check if contact already exists
        const existingContact = await UserEmergencyContact.findOne({
            where: {
                user_id: userId,
                contact_type: contact_type
            }
        });

        let contact;

        if (existingContact) {
            // Update existing
            await existingContact.update({
                name,
                relationship,
                phone,
                email
            });
            contact = existingContact;
        } else {
            // Create new
            contact = await UserEmergencyContact.create({
                user_id: userId,
                contact_type,
                name,
                relationship,
                phone,
                email
            });
        }

        res.json({
            success: true,
            message: existingContact ? 'Contact updated' : 'Contact created',
            data: contact
        });

    } catch (error) {
        console.error('Error saving emergency contact:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save emergency contact'
        });
    }
});

// Delete emergency contact
router.delete('/:userId/:contactId', protect, async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        // Check access
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const contact = await UserEmergencyContact.findOne({
            where: {
                id: contactId,
                user_id: userId
            }
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        await contact.destroy();

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete contact'
        });
    }
});

module.exports = router;