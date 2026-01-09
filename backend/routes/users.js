const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { protect } = require('../middleware/auth');

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      first_name, 
      last_name, 
      phone, 
      role, 
      customer_id 
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check username uniqueness
    const existingUsername = await User.findOne({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Validate customer_id for customer role
    if (role === 'customer' && !customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer company is required for customer POC users'
      });
    }

    // Hash password before creating user
const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
  username,
  email,
  password: hashedPassword,
  full_name: `${first_name || ''} ${last_name || ''}`.trim() || username,
  first_name: first_name || null,
  last_name: last_name || null,
  phone: phone || null,
  role: role || 'field',
  company: 'Braxon Industries',  // ✅ ALWAYS set for User Management users
  customer_id: role === 'customer' ? customer_id : null,
  is_active: true
});

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { 
      username, 
      email, 
      first_name, 
      last_name, 
      phone, 
      role, 
      customer_id, 
      is_active, 
      password 
    } = req.body;

    // Validate customer_id for customer role
    if (role === 'customer' && !customer_id && !user.customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer company is required for customer POC users'
      });
    }

    const updateData = {
      username: username || user.username,
      email: email || user.email,
      first_name: first_name !== undefined ? first_name : user.first_name,
      last_name: last_name !== undefined ? last_name : user.last_name,
      phone: phone !== undefined ? phone : user.phone,
      role: role || user.role,
      customer_id: role === 'customer' 
        ? (customer_id !== undefined ? customer_id : user.customer_id) 
        : null,
      is_active: is_active !== undefined ? is_active : user.is_active
    };

    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    await user.update(updateData);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Get user profile (with additional profile data)
router.get('/:userId/profile', protect, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check access
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

module.exports = router;