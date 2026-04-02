const { Exhibitor, Prospect, TradeShow } = require('../models');

// GET /api/exhibitors
exports.getAll = async (req, res) => {
  try {
    const exhibitors = await Exhibitor.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: TradeShow, as: 'tradeShow', attributes: ['id', 'name'] }]
    });
    res.json(exhibitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tradeshows/:tradeShowId/exhibitors
exports.getByTradeShow = async (req, res) => {
  try {
    const exhibitors = await Exhibitor.findAll({
      where: { tradeShowId: req.params.tradeShowId },
      include: [{ model: Prospect, as: 'prospects', attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(exhibitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/exhibitors/:id
exports.getById = async (req, res) => {
  try {
    const include = req.query.include === 'prospects'
      ? [{ model: Prospect, as: 'prospects' }]
      : [];

    const exhibitor = await Exhibitor.findByPk(req.params.id, {
      include: [
        ...include,
        { model: TradeShow, as: 'tradeShow', attributes: ['id', 'name'] },
      ],
    });
    if (!exhibitor) return res.status(404).json({ error: 'Exhibitor not found' });
    res.json(exhibitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tradeshows/:tradeShowId/exhibitors
exports.create = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.create({
      ...req.body,
      tradeShowId: req.params.tradeShowId,
    });
    res.status(201).json(exhibitor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/exhibitors/:id
exports.update = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.findByPk(req.params.id);
    if (!exhibitor) return res.status(404).json({ error: 'Exhibitor not found' });

    await exhibitor.update(req.body);
    res.json(exhibitor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/exhibitors/:id
exports.remove = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.findByPk(req.params.id);
    if (!exhibitor) return res.status(404).json({ error: 'Exhibitor not found' });

    await exhibitor.destroy();
    res.json({ message: 'Exhibitor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
