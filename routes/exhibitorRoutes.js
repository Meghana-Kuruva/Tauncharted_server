const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exhibitorController');

router.get('/exhibitors', ctrl.getAll);
router.get('/tradeshows/:tradeShowId/exhibitors', ctrl.getByTradeShow);
router.post('/tradeshows/:tradeShowId/exhibitors', ctrl.create);
router.get('/exhibitors/:id', ctrl.getById);
router.put('/exhibitors/:id', ctrl.update);
router.delete('/exhibitors/:id', ctrl.remove);

module.exports = router;
