const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Screen captures working' });
});

// GET screen captures for a project (no auth, returns empty for now)
router.get('/projects/:projectId', (req, res) => {
    try {
        const { projectId } = req.params;
        const { site } = req.query;

        // Return empty array for now
        res.json({
            success: true,
            data: [],
            projectId: projectId,
            site: site || 'all'
        });

    } catch (error) {
        console.error('Get screen captures error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving screen captures'
        });
    }
});

module.exports = router;