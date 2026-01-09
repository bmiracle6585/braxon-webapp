const express = require('express');
const router = express.Router();
const { Customer, Project, User } = require('../models');
const { protect } = require('../middleware/auth');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ['id', 'name', 'contact_name', 'contact_email', 'contact_phone'],
      order: [['name', 'ASC'], ['contact_name', 'ASC']]
    });
    
    // Count projects for each customer
    const customersWithProjects = await Promise.all(
      customers.map(async (customer) => {
        const projectCount = await Project.count({
          where: { customer_id: customer.id }
        });
        
        return {
          id: customer.id,
          name: customer.name,
          contact_name: customer.contact_name,
          contact_email: customer.contact_email,
          contact_phone: customer.contact_phone,
          project_count: projectCount
        };
      })
    );
    
    res.json({
      success: true,
      count: customersWithProjects.length,
      data: customersWithProjects
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      attributes: ['id', 'name', 'contact_name', 'contact_email', 'contact_phone']
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get project count
    const projectCount = await Project.count({
      where: { customer_id: customer.id }
    });

    res.json({
      success: true,
      data: {
        ...customer.toJSON(),
        project_count: projectCount
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
});

// @desc    Get all contacts for a specific company
// @route   GET /api/customers/company/:companyName/contacts
// @access  Private
router.get('/company/:companyName/contacts', protect, async (req, res) => {
  try {
    const contacts = await Customer.findAll({
      where: { name: req.params.companyName },
      attributes: ['id', 'contact_name', 'contact_email', 'contact_phone'],
      order: [['contact_name', 'ASC']]
    });

    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Get company contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

// @desc    Create new customer contact
// @route   POST /api/customers
// @access  Private (Admin/PM only)
router.post('/', protect, async (req, res) => {
  try {
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create customers'
      });
    }

    const {
      name,
      contact_name,
      contact_email,
      contact_phone
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company name'
      });
    }

    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide contact name'
      });
    }

    // ✅ ALLOW duplicate company names (each row is a contact)
    // Check for duplicate contact email for same company instead
    if (contact_email) {
      const existingContact = await Customer.findOne({
        where: { 
          name: name.trim(),
          contact_email: contact_email.trim()
        }
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: `A contact with email ${contact_email} already exists for ${name}`
        });
      }
    }

    // Create new contact
    const customer = await Customer.create({
      name: name.trim(),
      contact_name: contact_name.trim(),
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null
    });

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: {
        id: customer.id,
        name: customer.name,
        contact_name: customer.contact_name,
        contact_email: customer.contact_email,
        contact_phone: customer.contact_phone
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating contact'
    });
  }
});

// @desc    Update customer contact
// @route   PUT /api/customers/:id
// @access  Private (Admin/PM only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update customers'
      });
    }

    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const {
      name,
      contact_name,
      contact_email,
      contact_phone
    } = req.body;

    // Check for duplicate email if email is being changed
    if (contact_email && contact_email.trim() !== customer.contact_email) {
      const existingContact = await Customer.findOne({
        where: { 
          name: name?.trim() || customer.name,
          contact_email: contact_email.trim(),
          id: { [require('sequelize').Op.ne]: req.params.id }
        }
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: `A contact with email ${contact_email} already exists for this company`
        });
      }
    }

    await customer.update({
      name: name?.trim() || customer.name,
      contact_name: contact_name?.trim() || customer.contact_name,
      contact_email: contact_email !== undefined ? contact_email?.trim() : customer.contact_email,
      contact_phone: contact_phone !== undefined ? contact_phone?.trim() : customer.contact_phone
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: {
        id: customer.id,
        name: customer.name,
        contact_name: customer.contact_name,
        contact_email: customer.contact_email,
        contact_phone: customer.contact_phone
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact'
    });
  }
});

// @desc    Delete customer contact
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete customers'
      });
    }

    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if this contact has projects assigned
    const projectCount = await Project.count({
      where: { customer_id: req.params.id }
    });

    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete contact with ${projectCount} active project(s). Please reassign projects first.`
      });
    }

    const contactName = customer.contact_name;
    const companyName = customer.name;
    await customer.destroy();

    res.json({
      success: true,
      message: `Contact "${contactName}" from ${companyName} deleted successfully`
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact'
    });
  }
});

module.exports = router;