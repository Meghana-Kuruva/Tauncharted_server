const sequelize = require('../config/database');
const TradeShow = require('./TradeShow');
const Exhibitor = require('./Exhibitor');
const Prospect = require('./Prospect');
const User = require('./User');

// Associations
TradeShow.hasMany(Exhibitor, {
  foreignKey: 'tradeShowId',
  as: 'exhibitors',
  onDelete: 'CASCADE',
});
Exhibitor.belongsTo(TradeShow, {
  foreignKey: 'tradeShowId',
  as: 'tradeShow',
});

Exhibitor.hasMany(Prospect, {
  foreignKey: 'exhibitorId',
  as: 'prospects',
  onDelete: 'CASCADE',
});
Prospect.belongsTo(Exhibitor, {
  foreignKey: 'exhibitorId',
  as: 'exhibitor',
});

module.exports = { sequelize, TradeShow, Exhibitor, Prospect, User };
