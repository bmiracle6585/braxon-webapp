// backend/routes/customers.js
const express = require('express');
const router = express.Router();
const { Customer, Project } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

/*
|--------------------------------------------------------------------------
| GET ALL CUSTOMERS
|--------------------------------------------------------------------------
*/
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: [
        'id',
        'name',
        'contact_name',
        'contact_email',
        'contact_phone',
        'customer_pm',
        'address'
      ],
      order: [
        ['name', 'ASC'],
        ['contact_name', 'ASC']
      ]
    });

    const data = await Promise.all(
      customers.map(async (c) => {
        let projectCount = 0;

        try {
          projectCount = await Project.count({
            where: { customer_id: c.id }
          });
        } catch (_) {
          projectCount = 0;
        }

        return {
          id: c.id,
          name: c.name,
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
| CREATE CUSTOMER / CONTACT
|--------------------------------------------------------------------------
*/
router.post('/', protect, async (req, res) => {
  try {
    if (!['admin', 'pm'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, contact_name, contact_email, contact_phone, customer_pm, address } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Company name required' });
    }

    if (!contact_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name required' });
    }

    const customer = await Customer.create({
      name: name.trim(),
      customer_name: name.trim(),
      contact_name: contact_name.trim(),
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      customer_pm: customer_pm?.trim() || null,
      address: address?.trim() || null
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Error creating contact' });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE CUSTOMER
|--------------------------------------------------------------------------
*/
router.put('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updates = {};
    ['name', 'contact_name', 'contact_email', 'contact_phone', 'customer_pm', 'address'].forEach((k) => {
      if (req.body[k] !== undefined) {
        updates[k] = req.body[k]?.trim() || null;
      }
    });

    if (updates.name) {
      updates.customer_name = updates.name;
    }

    await customer.update(updates);
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Error updating contact' });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE CUSTOMER
|--------------------------------------------------------------------------
*/
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await customer.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Error deleting contact' });
  }
});

module.exports = router;
