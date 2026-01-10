const express = require('express');
const router = express.Router();
const { Customer, Project } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

/*
|--------------------------------------------------------------------------
| GET ALL CUSTOMERS (CONTACT ROWS)
|--------------------------------------------------------------------------
*/
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: [
        'id',
        'customer_name',
        'contact_name',
        'contact_email',
        'contact_phone',
        'customer_pm',
        'address'
      ],
      order: [
        ['customer_name', 'ASC'],
        ['contact_name', 'ASC']
      ]
    });

    const data = await Promise.all(
      customers.map(async (c) => {
        const projectCount = await Project.count({
          where: { customer_id: c.id }
        });

        return {
          id: c.id,
          customer_name: c.customer_name,
          contact_name: c.contact_name,
          contact_email: c.contact_email,
          contact_phone: c.contact_phone,
          customer_pm: c.customer_pm,
          address: c.address,
          project_count: projectCount
        };
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching customers' });
  }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE CONTACT
|--------------------------------------------------------------------------
*/
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

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
    res.status(500).json({ success: false, message: 'Error fetching customer' });
  }
});

/*
|--------------------------------------------------------------------------
| GET CONTACTS BY COMPANY
|--------------------------------------------------------------------------
*/
router.get('/company/:companyName/contacts', protect, async (req, res) => {
  try {
    const contacts = await Customer.findAll({
      where: { customer_name: req.params.companyName },
      order: [['contact_name', 'ASC']]
    });

    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    console.error('Get company contacts error:', error);
    res.status(500).json({ success: false, message: 'Error fetching contacts' });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE NEW CONTACT
|--------------------------------------------------------------------------
*/
router.post('/', protect, async (req, res) => {
  try {
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const {
      customer_name,
      contact_name,
      contact_email,
      contact_phone,
      customer_pm,
      address
    } = req.body;

    if (!customer_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Company name required' });
    }

    if (!contact_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name required' });
    }

    if (contact_email) {
      const exists = await Customer.findOne({
        where: {
          customer_name: customer_name.trim(),
          contact_email: contact_email.trim()
        }
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: `Contact email already exists for ${customer_name}`
        });
      }
    }

    const customer = await Customer.create({
      customer_name: customer_name.trim(),
      contact_name: contact_name.trim(),
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      customer_pm: customer_pm?.trim() || null,
      address: address?.trim() || null
    });

    res.status(201).json({
      success: true,
      message: 'Contact created',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Error creating contact' });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE CONTACT
|--------------------------------------------------------------------------
*/
router.put('/:id', protect, async (req, res) => {
  try {
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const {
      customer_name,
      contact_name,
      contact_email,
      contact_phone,
      customer_pm,
      address
    } = req.body;

    if (contact_email && contact_email !== customer.contact_email) {
      const exists = await Customer.findOne({
        where: {
          customer_name: customer_name || customer.customer_name,
          contact_email,
          id: { [Op.ne]: customer.id }
        }
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate contact email for this company'
        });
      }
    }

    await customer.update({
      customer_name: customer_name?.trim() ?? customer.customer_name,
      contact_name: contact_name?.trim() ?? customer.contact_name,
      contact_email: contact_email !== undefined ? contact_email?.trim() : customer.contact_email,
      contact_phone: contact_phone !== undefined ? contact_phone?.trim() : customer.contact_phone,
      customer_pm: customer_pm !== undefined ? customer_pm?.trim() : customer.customer_pm,
      address: address !== undefined ? address?.trim() : customer.address
    });

    res.json({ success: true, message: 'Contact updated', data: customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Error updating contact' });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE CONTACT
|--------------------------------------------------------------------------
*/
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const projectCount = await Project.count({
      where: { customer_id: customer.id }
    });

    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete contact with active projects'
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: `Contact ${customer.contact_name} deleted`
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Error deleting contact' });
  }
});

module.exports = router;
