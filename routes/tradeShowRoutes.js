const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tradeShowController');

router.get('/', ctrl.getAll);
router.get('/stats', ctrl.getDashboardStats);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.post('/bulk-import', ctrl.globalBulkImport);
router.put('/:id', ctrl.update);
router.post('/:id/bulk-import', ctrl.bulkImport);
router.delete('/:id', ctrl.remove);

module.exports = router;
