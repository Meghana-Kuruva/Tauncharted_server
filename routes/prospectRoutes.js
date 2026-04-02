const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prospectController');

router.get('/prospects', ctrl.getAll);
router.get('/exhibitors/:exhibitorId/prospects', ctrl.getByExhibitor);
router.post('/exhibitors/:exhibitorId/prospects', ctrl.create);
router.get('/prospects/:id', ctrl.getById);
router.put('/prospects/:id', ctrl.update);
router.delete('/prospects/:id', ctrl.remove);

module.exports = router;
