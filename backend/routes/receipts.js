const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const { Receipt, ReceiptEmailRecipient } = require('../models');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/receipts');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'));
  }
});

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// @desc    Submit new receipt
// @route   POST /api/receipts
// @access  Public (auth disabled for testing)
router.post('/', upload.single('receipt_image'), async (req, res) => {
  try {
    const {
      project_id,
      vendor,
      amount,
      category,
      description,
      purchase_date,
      user_id,
      expense_type
    } = req.body;

    console.log('📝 Receipt submission:', { project_id, vendor, amount, category, user_id });

    if (!project_id || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Project, amount, and category are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image is required'
      });
    }

    const receiptNumber = 'RCP-' + Date.now();
    const imagePath = `/uploads/receipts/${req.file.filename}`;
    let thumbnailPath = null;

    // Generate thumbnail for images
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const thumbDir = path.join(__dirname, '../../uploads/receipts/thumbnails');
        await fs.mkdir(thumbDir, { recursive: true });
        
        const thumbFilename = 'thumb-' + req.file.filename;
        const thumbFullPath = path.join(thumbDir, thumbFilename);
        
        await sharp(req.file.path)
          .resize(400, 400, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toFile(thumbFullPath);
        
        thumbnailPath = `/uploads/receipts/thumbnails/${thumbFilename}`;
      } catch (error) {
        console.error('Thumbnail generation error:', error);
      }
    }

    // Create receipt
    const receipt = await Receipt.create({
      receipt_number: receiptNumber,
      user_id: user_id || 1,
      project_id: project_id,
      amount: parseFloat(amount),
      category: category,
      expense_type: expense_type || 'company',
      vendor: vendor,
      purchase_date: purchase_date || new Date(),
      description: description,
      image_path: imagePath,
      thumbnail_path: thumbnailPath,
      status: 'pending'
    });

    console.log('✅ Receipt created:', receipt.id);

    res.status(201).json({
      success: true,
      data: receipt,
      message: 'Receipt submitted successfully'
    });
  } catch (error) {
    console.error('Submit receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting receipt',
      error: error.message
    });
  }
});

// @desc    Get receipts for project
// @route   GET /api/receipts/project/:projectId
// @access  Public
router.get('/project/:projectId', async (req, res) => {
  try {
    const receipts = await Receipt.findAll({
      where: { project_id: req.params.projectId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipts',
      error: error.message
    });
  }
});

// @desc    Get all receipts
// @route   GET /api/receipts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const receipts = await Receipt.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    console.error('Get all receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipts',
      error: error.message
    });
  }
});

// @desc    Approve/Reject receipt
// @route   PUT /api/receipts/:id/status
// @access  Public
router.put('/:id/status', async (req, res) => {
  try {
    const { status, approval_notes, approved_by } = req.body;

    const receipt = await Receipt.findByPk(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    await receipt.update({
      status: status,
      approval_notes: approval_notes,
      approved_by: approved_by || 1,
      approved_at: new Date()
    });

    res.json({
      success: true,
      data: receipt,
      message: `Receipt ${status}`
    });
  } catch (error) {
    console.error('Update receipt status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating receipt',
      error: error.message
    });
  }
});

// @desc    Delete receipt
// @route   DELETE /api/receipts/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Delete files
    if (receipt.image_path) {
      try {
        const filename = path.basename(receipt.image_path);
        const filePath = path.join(__dirname, '../../uploads/receipts', filename);
        await fs.unlink(filePath);
        
        if (receipt.thumbnail_path) {
          const thumbFilename = path.basename(receipt.thumbnail_path);
          const thumbPath = path.join(__dirname, '../../uploads/receipts/thumbnails', thumbFilename);
          await fs.unlink(thumbPath);
        }
      } catch (error) {
        console.error('File deletion error:', error);
      }
    }

    await receipt.destroy();

    res.json({
      success: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting receipt',
      error: error.message
    });
  }
});

// @desc    Get email distribution list
// @route   GET /api/receipts/email-distribution
// @access  Public
// Get receipts for specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const receipts = await Receipt.findAll({
            where: { user_id: req.params.userId },
            include: [
                { 
                    model: Project, 
                    attributes: ['id', 'name', 'project_code'] 
                },
                { 
                    model: User, 
                    as: 'ApprovedBy', 
                    attributes: ['id', 'name'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ 
            success: true, 
            count: receipts.length, 
            data: receipts 
        });
    } catch (error) {
        console.error('Error fetching user receipts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch receipts' 
        });
    }
});

// @desc    Add email to distribution
// @route   POST /api/receipts/email-distribution
// @access  Public
router.post('/email-distribution', async (req, res) => {
  try {
    const { email, name, added_by } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const emailEntry = await ReceiptEmailRecipient.create({
      email: email,
      name: name,
      is_active: true,
      added_by: added_by || 1
    });

    res.json({
      success: true,
      data: emailEntry,
      message: 'Email added to distribution list'
    });
  } catch (error) {
    console.error('Add email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding email',
      error: error.message
    });
  }
});

// @desc    Delete email from distribution
// @route   DELETE /api/receipts/email-distribution/:id
// @access  Public
router.delete('/email-distribution/:id', async (req, res) => {
  try {
    const email = await ReceiptEmailRecipient.findByPk(req.params.id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    await email.destroy();

    res.json({
      success: true,
      message: 'Email removed from distribution list'
    });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing email',
      error: error.message
    });
  }
});

module.exports = router;