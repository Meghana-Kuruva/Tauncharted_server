const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/extractorController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// AI Extractor Endpoints
// Protected: Only admins and associates can use the AI extractor
router.post('/extract', verifyToken, requireRole('admin', 'associate'), ctrl.extract);
router.post('/save', verifyToken, requireRole('admin', 'associate'), ctrl.save);

module.exports = router;
