const { Prospect, Exhibitor } = require('../models');

// GET /api/prospects
exports.getAll = async (req, res) => {
  try {
    const prospects = await Prospect.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: Exhibitor, as: 'exhibitor', attributes: ['id', 'exhibitorName'] }]
    });
    res.json(prospects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/exhibitors/:exhibitorId/prospects
exports.getByExhibitor = async (req, res) => {
  try {
    const prospects = await Prospect.findAll({
      where: { exhibitorId: req.params.exhibitorId },
      order: [['createdAt', 'DESC']],
    });
    res.json(prospects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prospects/:id
exports.getById = async (req, res) => {
  try {
    const prospect = await Prospect.findByPk(req.params.id, {
      include: [{ model: Exhibitor, as: 'exhibitor', attributes: ['id', 'exhibitorName'] }],
    });
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
    res.json(prospect);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/exhibitors/:exhibitorId/prospects
exports.create = async (req, res) => {
  try {
    const prospect = await Prospect.create({
      ...req.body,
      exhibitorId: req.params.exhibitorId,
    });
    res.status(201).json(prospect);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/prospects/:id
exports.update = async (req, res) => {
  try {
    const prospect = await Prospect.findByPk(req.params.id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    await prospect.update(req.body);
    res.json(prospect);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/prospects/:id
exports.remove = async (req, res) => {
  try {
    const prospect = await Prospect.findByPk(req.params.id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    await prospect.destroy();
    res.json({ message: 'Prospect deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
